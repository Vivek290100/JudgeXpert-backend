// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\interfaces\IUserService.ts
import { IUser } from "./IUser";

export interface IUserService {
    initiateSignUp(data: Partial<IUser>): Promise<{ message: string; email: string }>;
    verifyOtpAndCreateUser(email: string, otp: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
    refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }>;
    loginUser(email: string, password: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
    logout(userId: string): Promise<void>;
    resendOtp(email: string): Promise<{ message: string; email: string }>;
    forgotPassword(email: string): Promise<{ message: string; email: string }>;
    verifyForgotPasswordOtp(email: string, otp: string): Promise<void>;
    resetPassword(email: string, otp: string, newPassword: string): Promise<void>;
    updateProfile(data: {userId: string; fullName?: string; github?: string; linkedin?: string; profileImage?: Express.Multer.File;}): Promise<IUser>;
    googleLogin(credential: string): Promise<{ user: IUser; accessToken: string; refreshToken: string }>;
  }