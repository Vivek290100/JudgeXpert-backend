import { IUser } from "../types/IUser";
import { randomInt } from "crypto";
import bcrypt from "bcrypt";
import { IUserService } from "../interfaces/serviceInterfaces/IUserService";
import { uploadToS3 } from "../utils/s3";
import { CONFIG } from "../config/config";
import { OAuth2Client } from "google-auth-library";
import { IUserRepository } from "../interfaces/repositoryInterfaces/IUserRepository";
import { IRefreshTokenRepository } from "../interfaces/repositoryInterfaces/IRefreshTokenRepository";
import { BadRequestError, ErrorMessages, ForbiddenError, NotFoundError, UnauthorizedError } from "../utils/errors";
import { IJWTService } from "../interfaces/utilInterfaces/IJWTService";
import { IEmailService } from "../interfaces/utilInterfaces/IEmailService";
import { IRedisService } from "../interfaces/utilInterfaces/IRedisService";
import { ILeaderboardUser } from "../types/ILeaderboardUser";

class UserService implements IUserService {
  private _googleClient = new OAuth2Client(CONFIG.GOOGLE_CLIENT_ID);

  constructor(
    private _userRepository: IUserRepository,
    private _refreshTokenRepository: IRefreshTokenRepository,
    private _jwtService: IJWTService,
    private _emailService: IEmailService,
    private _redisService: IRedisService
  ) {}

  private async generateAndSendOtp(email: string, purpose: "signup" | "reset" = "signup"): Promise<string> {
    const otp = randomInt(100000, 999999).toString();
    const otpKey = `${purpose}:otp:${email}`;
    console.log(otp, email);

    await this._redisService.set(otpKey, otp, { EX: CONFIG.OTP_EXPIRY_SECONDS });
    await this._emailService.sendOtpEmail({
      to: email,
      subject: purpose === "signup" ? "Verify your email" : "Reset your password",
      otp,
      error: "",
    });
    return otp;
  }

  async initiateSignUp(data: Partial<IUser>): Promise<{ message: string; email: string }> {
    if (!data.email || !data.password || !data.userName) {
      throw new BadRequestError(ErrorMessages.MISSING_REQUIRED_FIELD("email, password, or userName"));
    }

    const existingUser = await this._userRepository.findByQuery({
      $or: [{ email: data.email }, { userName: data.userName }],
    });

    if (existingUser) {
      throw new BadRequestError(ErrorMessages.USER_EXISTS);
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
    await this._redisService.set(`tempUser:${data.email}`, JSON.stringify(userData), {
      EX: CONFIG.OTP_EXPIRY_SECONDS,
    });
    await this.generateAndSendOtp(data.email);
    return { message: "Registration OTP sent successfully", email: data.email };
  }

  async verifyOtpAndCreateUser(email: string, otp: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const storedOtp = await this._redisService.get(`signup:otp:${email}`);

    if (!storedOtp) {
      throw new BadRequestError(ErrorMessages.OTP_EXPIRED);
    }
    if (storedOtp !== otp) {
      throw new BadRequestError(ErrorMessages.INVALID_OTP);
    }

    const userDataString = await this._redisService.get(`tempUser:${email}`);
    if (!userDataString) {
      throw new BadRequestError(ErrorMessages.SIGNUP_SESSION_EXPIRED);
    }

    const userData = JSON.parse(userDataString);
    const user = await this._userRepository.create(userData);

    await Promise.all([
      this._redisService.del(`signup:otp:${email}`),
      this._redisService.del(`tempUser:${email}`),
    ]);

    const userIdString = user._id.toString();
    const accessToken = this._jwtService.generateAccessToken(userIdString);
    const refreshToken = this._jwtService.generateRefreshToken(userIdString);

    await this._refreshTokenRepository.create({
      userId: userIdString,
      token: refreshToken,
    });

    return { user, accessToken, refreshToken };
  }

  async refreshAccessToken(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const storedToken = await this._refreshTokenRepository.findByUserId(userId);
    if (!storedToken) {
      throw new UnauthorizedError(ErrorMessages.NO_REFRESH_TOKEN);
    }
  
    try {
      this._jwtService.verifyToken(storedToken, "refresh");
    } catch (error) {
      await this._refreshTokenRepository.deleteByUserId(userId);
      throw new UnauthorizedError(ErrorMessages.INVALID_REFRESH_TOKEN);
    }
  
    const newAccessToken = this._jwtService.generateAccessToken(userId);
    const newRefreshToken = this._jwtService.generateRefreshToken(userId);
  
    await this._refreshTokenRepository.updateToken(userId, newRefreshToken);
  
    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async loginUser(email: string, password: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const user = await this._userRepository.findByQuery({ email });
    
    if (!user) {
      throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);
    }

    if (user.isBlocked) {
      throw new ForbiddenError(ErrorMessages.USER_BLOCKED);
    }

    const isPasswordValid = await bcrypt.compare(password, user.password || "");
    if (!isPasswordValid) {
      throw new BadRequestError(ErrorMessages.INVALID_CREDENTIALS);
    }

    const userIdString = user._id.toString();
    const accessToken = this._jwtService.generateAccessToken(userIdString);
    const refreshToken = this._jwtService.generateRefreshToken(userIdString);

    await this._refreshTokenRepository.create({
      userId: userIdString,
      token: refreshToken,
    });

    return { user, accessToken, refreshToken };
  }

  async logout(userId: string): Promise<void> {
    const storedToken = await this._refreshTokenRepository.findByUserId(userId);
    if (!storedToken) {
      throw new NotFoundError(ErrorMessages.NO_REFRESH_TOKEN);
    }
    await this._refreshTokenRepository.deleteByUserId(userId);
  }

  async resendOtp(email: string): Promise<{ message: string; email: string }> {
    const userData = await this._redisService.get(`tempUser:${email}`);
    if (!userData) {
      throw new BadRequestError(ErrorMessages.SIGNUP_SESSION_EXPIRED);
    }
    await this.generateAndSendOtp(email, "signup");
    return { message: "OTP resent successfully", email };
  }

  async forgotPassword(email: string): Promise<{ message: string; email: string }> {
    const user = await this._userRepository.findByQuery({ email });
    if (!user) {
      throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);
    }
    if (user.isGoogleAuth) {
      throw new BadRequestError(ErrorMessages.GOOGLE_AUTH_PASSWORD);
    }
    await this.generateAndSendOtp(email, "reset");
    return { message: "Otp sent successfully for reset password", email };
  }

  async verifyForgotPasswordOtp(email: string, otp: string): Promise<void> {
    const storedOtp = await this._redisService.get(`reset:otp:${email}`);

    if (!storedOtp) {
      throw new BadRequestError(ErrorMessages.OTP_EXPIRED);
    }
    if (storedOtp !== otp) {
      throw new BadRequestError(ErrorMessages.INVALID_OTP);
    }

    await this._redisService.set(`reset:verified:${email}`, "true", { EX: CONFIG.OTP_EXPIRY_SECONDS });
    await this._redisService.del(`reset:otp:${email}`);
  }

  async resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
    const isVerified = await this._redisService.get(`reset:verified:${email}`);
    if (!isVerified) {
      throw new BadRequestError(ErrorMessages.OTP_NOT_VERIFIED);
    }

    const user = await this._userRepository.findByQuery({ email });
    if (!user) {
      throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this._userRepository.update(user._id.toString(), { password: hashedPassword });

    await this._redisService.del(`reset:verified:${email}`);
  }

  async updateProfile(data: {
    userId: string;
    fullName?: string;
    github?: string;
    linkedin?: string;
    profileImage?: Express.Multer.File;
  }): Promise<IUser> {
    const updateData: Partial<IUser> = {};
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.github) updateData.github = data.github;
    if (data.linkedin) updateData.linkedin = data.linkedin;

    if (data.profileImage) {
      const s3Url = await uploadToS3(data.profileImage);
      updateData.profileImage = s3Url;
    }

    const updatedUser = await this._userRepository.update(data.userId, updateData);
    if (!updatedUser) throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);

    return updatedUser;
  }

  async googleLogin(credential: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    try {
      const ticket = await this._googleClient.verifyIdToken({
        idToken: credential,
        audience: CONFIG.GOOGLE_CLIENT_ID,
      });
      
      const payload = ticket.getPayload();
      if (!payload?.email) {
        throw new BadRequestError(ErrorMessages.INVALID_CREDENTIALS);
      }

      let user = await this._userRepository.findByQuery({ email: payload.email });
      
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

        user = await this._userRepository.create(userData);
      }

      if (user.isBlocked) {
        throw new ForbiddenError(ErrorMessages.USER_BLOCKED);
      }

      const userIdString = user._id.toString();
      const accessToken = this._jwtService.generateAccessToken(userIdString);
      const refreshToken = this._jwtService.generateRefreshToken(userIdString);

      await this._refreshTokenRepository.create({
        userId: userIdString,
        token: refreshToken,
      });

      return { user, accessToken, refreshToken };
    } catch (error) {
      throw new BadRequestError(ErrorMessages.GOOGLE_LOGIN_FAILED(error instanceof Error ? error.message : String(error)));
    }
  }

  async getLeaderboard(page: number, limit: number): Promise<{ leaderboard: ILeaderboardUser[]; totalPages: number; currentPage: number }> {
    
    const { users, total } = await this._userRepository.findLeaderboard(page, limit);
    console.log("usersssssssssssssss",users);
    
    const totalPages = Math.ceil(total / limit);

    return {
      leaderboard: users,
      totalPages,
      currentPage: page,
    };
  }
}

export default UserService;