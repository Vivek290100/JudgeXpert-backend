import { Request, Response } from "express";
import UserService from "../services/UserService";

interface AuthRequest extends Request {
  user?: { userId: string };
}

class UserController {
  constructor(private _userService: UserService) {}

  async signUpUser(req: Request, res: Response): Promise<void> {
    // console.log("signuppppppppp",req.body);
    
    try {
      const { email, password, userName, fullName } = req.body;
      const result = await this._userService.initiateSignUp({
        email,
        password,
        userName,
        fullName,
      });

      res.status(200).json({
        success: true,
        message: "OTP sent to email",
        email: result.email,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      // console.log("its verify otp controller", otp, email);
      const { user, accessToken, refreshToken } = await this._userService.verifyOtpAndCreateUser(email, otp);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });

      const filteredUser = {
        id: user._id,
        userName: user.userName,
        fullName: user.fullName,
        email: user.email,
        profileImage:
          user.profileImage ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?fit=crop&w=32&h=32",
        role: user.role,
        joinedDate: user.joinedDate,
        problemsSolved: user.problemsSolved ?? 0,
        rank: user.rank ?? 0,
      };

      res.status(200).json({
        success: true,
        message: "User verified successfully",
        user: filteredUser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const email = req.body.email;
      await this._userService.resendOtp(email);

      res.status(200).json({
        success: true,
        message: "OTP resent successfully",
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }


  async loginUser(req: Request, res: Response): Promise<void> {
    // console.log("its login controller");
    
    try {
      const { email, password } = req.body;
      const { user, accessToken, refreshToken } = await this._userService.loginUser(email, password);

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 15 * 60 * 1000,
      });

      const filteredUser = {
        id: user._id,
        userName: user.userName,
        fullName: user.fullName,
        email: user.email,
        profileImage:
          user.profileImage ||
          "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?fit=crop&w=32&h=32",
        role: user.role,
        joinedDate: user.joinedDate,
        problemsSolved: user.problemsSolved ?? 0,
        rank: user.rank ?? 0,
      };

      res.status(200).json({
        success: true,
        message: "User logged in successfully",
        user: filteredUser,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  }


  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      // console.log("User ID:", userId);

      if (!userId) throw new Error("Unauthorized: No user ID found");

      await this._userService.logout(userId);

      // console.log("Cookies before clear:", req.cookies);
      res.clearCookie("accessToken", {
        httpOnly: true,
        secure: true,
        sameSite: "strict",
        path: "/",
      });
      // console.log("Cookies after clear:", req.cookies);

      res
        .status(200)
        .json({ success: true, message: "Logged out successfully" });
    } catch (error: any) {
      // console.error("Logout error:", error.message);
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

export default UserController;
