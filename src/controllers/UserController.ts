// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\controllers\UserController.ts
import { Request, Response } from "express";
import { sendResponse, filterUserResponse, setAuthCookie, clearAuthCookie,} from "../utils/responseUtils";
import { IUserService } from "../interfaces/IUserService";

interface AuthRequest extends Request {
  user?: { userId: string };
  file?: Express.Multer.File;
}
class UserController {
  constructor(private _userService: IUserService) {}

  async signUpUser(req: Request, res: Response): Promise<void> {
    try {
      const result = await this._userService.initiateSignUp({
        email: req.body.email,
        password: req.body.password,
        userName: req.body.userName,
        fullName: req.body.fullName,
      });

      sendResponse(res, {
        success: true,
        status: 200,
        message: result.message || "Sign-up initiated successfully",
        data: result.email ? { email: result.email } : {},
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 400,
        message: error.message || "An error occurred during sign-up",
        data: null,
      });
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await this._userService.verifyOtpAndCreateUser(email, otp);
      const { user, accessToken, refreshToken } = result;

      setAuthCookie(res, accessToken, refreshToken);
      const filteredUser = filterUserResponse(user);

      sendResponse(res, {
        success: true,
        status: 200,
        message: "OTP verified and user created successfully",
        data: { user: filteredUser },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 400,
        message: error.message || "An error occurred during OTP verification",
        data: null,
      });
    }
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const result = await this._userService.resendOtp(req.body.email);

      sendResponse(res, {
        success: true,
        status: 200,
        message: result.message || "OTP resent successfully",
        data: result.email ? { email: result.email } : {},
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 400,
        message: error.message || "An error occurred while resending OTP",
        data: null,
      });
    }
  }

  async loginUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this._userService.loginUser(email, password);
      const { user, accessToken, refreshToken } = result;

      setAuthCookie(res, accessToken, refreshToken);
      const filteredUser = filterUserResponse(user);

      sendResponse(res, {
        success: true,
        status: 200,
        message: "Login successful",
        data: { user: filteredUser },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 400,
        message: error.message || "An error occurred during login",
        data: null,
      });
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Unauthorized: No user ID found");

      await this._userService.logout(userId);
      clearAuthCookie(res);

      sendResponse(res, {
        success: true,
        status: 200,
        message: "Logged out successfully",
        data: null,
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 400,
        message: error.message || "An error occurred",
        data: null,
      });
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await this._userService.forgotPassword(req.body.email);

      sendResponse(res, {
        success: true,
        status: 200,
        message: result.message || "Password reset initiated successfully",
        data: result.email ? { email: result.email } : {},
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 400,
        message: error.message || "An error occurred during password reset initiation",
        data: null,
      });
    }
  }

  async verifyForgotPasswordOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      await this._userService.verifyForgotPasswordOtp(email, otp);

      sendResponse(res, {
        success: true,
        status: 200,
        message: "OTP verified successfully, Now you can enter new and confirm password",
        data: { email },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 400,
        message: error.message || "An error occurred",
        data: null,
      });
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !newPassword) {
        throw new Error("All fields are required");
      }

      await this._userService.resetPassword(email, otp, newPassword);

      sendResponse(res, {
        success: true,
        status: 200,
        message: "Password reset successfully",
        data: null,
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 400,
        message: error.message || "An error occurred",
        data: null,
      });
    }
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    console.log("Updating profile in controller");
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Unauthorized: No user ID found");

      const { fullName, github, linkedin } = req.body;
      const profileImage = req.file; // Multer provides the file object

      const updatedUser = await this._userService.updateProfile({
        userId,
        fullName,
        github,
        linkedin,
        profileImage, // Pass the file object directly
      });
      

      console.log("Raw Updated User:", updatedUser); 
    const filteredUser = filterUserResponse(updatedUser);
    console.log("Filtered User Response:", filteredUser);
      

      sendResponse(res, {
        success: true,
        status: 200,
        message: "Profile updated successfully",
        data: { user: filterUserResponse(updatedUser) },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 400,
        message: error.message || "An error occurred",
        data: null,
      });
    }
  }

  async googleLogin(req: Request, res: Response): Promise<void> {
    console.log("its googleLogin controller ");
    
    try {
      const { credential } = req.body;
      if (!credential) {
        throw new Error("Google credential is required");
      }

      const result = await this._userService.googleLogin(credential);
      const { user, accessToken, refreshToken } = result;

      setAuthCookie(res, accessToken, refreshToken);
      const filteredUser = filterUserResponse(user);

      sendResponse(res, {
        success: true,
        status: 200,
        message: "Google login successful",
        data: { user: filteredUser },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: error.status || 400,
        message: error.message || "An error occurred during Google login",
        data: null,
      });
    }
  }

}

export default UserController;