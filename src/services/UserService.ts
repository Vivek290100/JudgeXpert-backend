import { IUser } from "../interfaces/IUser";
import { randomInt } from "crypto";
import bcrypt from "bcrypt";
import redisClient from "../utils/redis";
import { sendOtpEmail } from "../utils/emailBrevo";
import JWTService from "../utils/jwt";
import { IUserService } from "../interfaces/IUserService";
import { uploadToS3 } from "../utils/s3";
import { CONFIG } from "../config/Config";
import { OAuth2Client } from "google-auth-library";
import { IUserRepository } from "../interfaces/IUserRepository";
import { IRefreshTokenRepository } from "../interfaces/IRefreshTokenRepository";

class UserService implements IUserService {
  private readonly OTP_EXPIRY_SECONDS = 300;
  private googleClient = new OAuth2Client(CONFIG.GOOGLE_CLIENT_ID);

  constructor(
    private userRepository: IUserRepository,
    private refreshTokenRepository: IRefreshTokenRepository
  ) {}

  private async generateAndSendOtp(email: string, purpose: "signup" | "reset" = "signup"): Promise<string> {
    const otp = randomInt(100000, 999999).toString();
    const otpKey = `${purpose}:otp:${email}`;
    console.log(otp, email);

    await redisClient.set(otpKey, otp, { EX: this.OTP_EXPIRY_SECONDS });
    await sendOtpEmail({
      to: email,
      subject: purpose === "signup" ? "Verify your email" : "Reset your password",
      otp,
      error: "",
    });
    return otp;
  }

  async initiateSignUp(data: Partial<IUser>): Promise<{ message: string; email: string }> {
    if (!data.email || !data.password || !data.userName) {
      throw new Error("Required fields are missing");
    }

    const existingUser = await this.userRepository.findByQuery({
      $or: [{ email: data.email }, { userName: data.userName }],
    });

    if (existingUser) {
      throw new Error("User with this email or username already exists");
    }

    const userData = {
      ...data,
      role: "user",
      profileImage: "",
      problemsSolved: 0,
      rank: 0,
      isBlocked: false,
      isPremium: false,
      isGoogleAuth: false,
      joinedDate: new Date(),
    };

    userData.password = await bcrypt.hash(data.password, 10);
    await redisClient.set(`tempUser:${data.email}`, JSON.stringify(userData), {
      EX: this.OTP_EXPIRY_SECONDS,
    });
    await this.generateAndSendOtp(data.email);
    return { message: "Registration OTP sent successfully", email: data.email };
  }

  async verifyOtpAndCreateUser(email: string, otp: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const storedOtp = await redisClient.get(`signup:otp:${email}`);

    if (!storedOtp) {
      throw new Error("OTP expired. Please request a new one.");
    }
    if (storedOtp !== otp) {
      throw new Error("Invalid OTP. Please enter the correct OTP.");
    }

    const userDataString = await redisClient.get(`tempUser:${email}`);
    if (!userDataString) {
      throw new Error("Sign up session expired. Please try again.");
    }

    const userData = JSON.parse(userDataString);
    const user = await this.userRepository.create(userData);

    await Promise.all([
      redisClient.del(`signup:otp:${email}`),
      redisClient.del(`tempUser:${email}`),
    ]);

    const userIdString = user._id.toString();
    const accessToken = JWTService.generateAccessToken(userIdString);
    const refreshToken = JWTService.generateRefreshToken(userIdString);

    await this.refreshTokenRepository.create({
      userId: userIdString,
      token: refreshToken,
    });

    return { user, accessToken, refreshToken };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    const decoded = JWTService.verifyToken(refreshToken, "refresh") as { userId: string };
    if (!decoded?.userId) {
      throw new Error("Invalid refresh token.");
    }

    const storedToken = await this.refreshTokenRepository.findByUserId(decoded.userId);
    if (!storedToken || storedToken.token !== refreshToken) {
      throw new Error("Refresh token is not valid.");
    }

    const newAccessToken = JWTService.generateAccessToken(decoded.userId);
    return { accessToken: newAccessToken };
  }

  async loginUser(email: string, password: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await this.userRepository.findByQuery({ email });
    if (!user) {
      throw new Error("User not found");
    }

    if (user.isBlocked) {
      throw new Error("You are not allowed to sign in. Your account has been blocked.");
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    const userIdString = user._id.toString();
    const accessToken = JWTService.generateAccessToken(userIdString);
    const refreshToken = JWTService.generateRefreshToken(userIdString);

    await this.refreshTokenRepository.create({
      userId: userIdString,
      token: refreshToken,
    });

    return { user, accessToken, refreshToken };
  }

  async logout(userId: string): Promise<void> {
    const storedToken = await this.refreshTokenRepository.findByUserId(userId);
    if (!storedToken) {
      throw new Error("No refresh token found for this user.");
    }
    await this.refreshTokenRepository.deleteByUserId(userId);
  }

  async resendOtp(email: string): Promise<{ message: string; email: string }> {
    const userData = await redisClient.get(`tempUser:${email}`);
    if (!userData) {
      throw new Error("Sign up session expired. Please start over.");
    }
    await this.generateAndSendOtp(email, "signup");
    return { message: "OTP resent successfully", email };
  }

  async forgotPassword(email: string): Promise<{ message: string; email: string }> {
    const user = await this.userRepository.findByQuery({ email });
    if (!user) {
      throw new Error("User with this email does not exist");
    }
    if (user.isGoogleAuth) {
      throw new Error("Please use Google to manage your password");
    }
    await this.generateAndSendOtp(email, "reset");
    return { message: "Otp sent successfully for reset password", email };
  }

  async verifyForgotPasswordOtp(email: string, otp: string): Promise<void> {
    const storedOtp = await redisClient.get(`reset:otp:${email}`);

    if (!storedOtp) {
      throw new Error("OTP expired. Please request a new one.");
    }
    if (storedOtp !== otp) {
      throw new Error("Invalid OTP. Please enter the correct OTP.");
    }

    await redisClient.set(`reset:verified:${email}`, "true", { EX: this.OTP_EXPIRY_SECONDS });
    await redisClient.del(`reset:otp:${email}`);
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const isVerified = await redisClient.get(`reset:verified:${email}`);
    if (!isVerified) {
      throw new Error("OTP not verified. Please verify OTP first.");
    }

    const user = await this.userRepository.findByQuery({ email });
    if (!user) {
      throw new Error("User not found.");
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(user._id.toString(), { password: hashedPassword });

    await redisClient.del(`reset:verified:${email}`);
  }

  async updateProfile(data: {
    userId: string;
    fullName?: string;
    github?: string;
    linkedin?: string;
    profileImage?: Express.Multer.File;
  }): Promise<IUser> {
    console.log("Updating user profile in service");

    const updateData: Partial<IUser> = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.github) updateData.github = data.github;
    if (data.linkedin) updateData.linkedin = data.linkedin;

    if (data.profileImage) {
      const s3Url = await uploadToS3(data.profileImage);
      updateData.profileImage = s3Url;
    }

    const updatedUser = await this.userRepository.update(data.userId, updateData);
    if (!updatedUser) throw new Error("User not found");

    return updatedUser;
  }

  async googleLogin(credential: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    console.log("its googleLogin service ");
    try {
      // Verify Google token
      const ticket = await this.googleClient.verifyIdToken({
        idToken: credential,
        audience: CONFIG.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload?.email) {
        throw new Error("Invalid Google token");
      }

      let user = await this.userRepository.findByQuery({ email: payload.email });
      
      // If user doesn't exist, create one
      if (!user) {
        const userData: Partial<IUser> = {
          email: payload.email,
          userName: payload.email.split("@")[0], 
          fullName: payload.name || "",
          role: "user",
          profileImage: payload.picture || "",
          isGoogleAuth: true,
          joinedDate: new Date(),
          problemsSolved: 0,
          rank: 0,
          isBlocked: false,
          isPremium: false,
        };

        user = await this.userRepository.create(userData);
      }

      if (user.isBlocked) {
        throw new Error("Your account is blocked. Please contact support.");
      }

      const userIdString = user._id.toString();
      const accessToken = JWTService.generateAccessToken(userIdString);
      const refreshToken = JWTService.generateRefreshToken(userIdString);

      await this.refreshTokenRepository.create({
        userId: userIdString,
        token: refreshToken,
      });

      return { user, accessToken, refreshToken };
    } catch (error) {
      throw new Error(`Google login failed: ${error}`);
    }
  }

}

export default UserService;