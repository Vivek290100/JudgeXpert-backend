// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\services\UserService.ts
import { IUser } from "../interfaces/IUser";
import { randomInt } from "crypto";
import bcrypt from "bcrypt";
import redisClient from "../utils/redis";
import { sendOtpEmail } from "../utils/emailBrevo";
import JWTService from "../utils/jwt";
import UserRepository from "../repositories/UserRepository";
import RefreshTokenRepository from "../repositories/RefreshTokenRepository";

class UserService {
  constructor(
    private userRepository: UserRepository,
    private refreshTokenRepository: RefreshTokenRepository
  ) {}

  private async generateAndSendOtp(email: string): Promise<string> {
    const otp = randomInt(100000, 999999).toString();
    console.log(otp, email);
    await redisClient.set(`otp:${email}`, otp, { EX: 300 });
    await sendOtpEmail({
      to: email,
      subject: "verify your email ",
      otp,
      error: "",
    });
    return otp;
  }

  async initiateSignUp(data: Partial<IUser>): Promise<{ email: string }> {
    // console.log("signup serviceeeeeeeeeeeeeeee");
    
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
      joinedDate: new Date(),
      solvedProblems: [],
      submissions: [],
      contestParticipations: [],
    };

    userData.password = await bcrypt.hash(data.password, 10);
    await redisClient.set(`tempUser:${data.email}`, JSON.stringify(userData), {
      EX: 300,
    });
    await this.generateAndSendOtp(data.email);
    return { email: data.email };
  }

  async verifyOtpAndCreateUser(
    email: string,
    otp: string
  ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    const storedOtp = await redisClient.get(`otp:${email}`);
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

    // Clean up Redis
    await Promise.all([
      redisClient.del(`otp:${email}`),
      redisClient.del(`tempUser:${email}`),
    ]);

    // Create user
    const userData = JSON.parse(userDataString);
    const user = await this.userRepository.create(userData);

    const accessToken = JWTService.generateAccessToken(user._id.toString());
    const refreshToken = JWTService.generateRefreshToken(user._id.toString());

    // Store refresh token in the database
    await this.refreshTokenRepository.create({
      userId: user._id,
      token: refreshToken,
    });
    return { user, accessToken, refreshToken };
  }

  async refreshAccessToken(
    refreshToken: string
  ): Promise<{ accessToken: string }> {
    try {
      const decoded = JWTService.verifyToken(refreshToken, "refresh");
      if (!decoded || typeof decoded !== "object" || !decoded.userId) {
        throw new Error("Invalid refresh token.");
      }
      const userId = decoded.userId;

      // checking refresh token is there or not
      const storedToken = await this.refreshTokenRepository.findByUserId(
        userId
      );
      if (!storedToken || storedToken.token !== refreshToken) {
        throw new Error("Refresh token is not valid.");
      }

      // Generate new access token
      const newAccessToken = JWTService.generateAccessToken(userId);

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new Error("Failed to refresh access token.");
    }
  }


  async loginUser( email: string, password: string ): Promise<{ user: IUser; accessToken: string; refreshToken: string }> {
    // console.log("its login user service");
    
    const user = await this.userRepository.findByQuery({ email });
    if(!user){
      // console.log("nooo userrrr");
    }

    if (!user) {
      throw new Error("User not found");
      
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("Invalid password");
    }

    const accessToken = JWTService.generateAccessToken(user._id.toString());
    const refreshToken = JWTService.generateRefreshToken(user._id.toString());

    // Store refresh token in the database
    await this.refreshTokenRepository.create({
      userId: user._id,
      token: refreshToken,
    });

    return { user, accessToken, refreshToken };
  }


  async logout(userId: string): Promise<void> {
    // console.log("It's logout service for user:", userId);
    const storedToken = await this.refreshTokenRepository.findByUserId(userId);
    if (!storedToken) {
      throw new Error("No refresh token found for this user.");
    }
    await this.refreshTokenRepository.deleteByUserId(userId);
  }

  async resendOtp(email: string): Promise<void> {
    console.log("its resend otp service", email);
    const userData = await redisClient.get(`tempUser:${email}`);
    // console.log("userdata", userData);

    if (!userData) {
      throw new Error("Sign up session expired. Please start over.");
    }
    await this.generateAndSendOtp(email);
  }
}

export default UserService;
