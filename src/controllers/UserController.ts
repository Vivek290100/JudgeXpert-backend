import { Request, Response } from "express";
import UserService from "../services/UserService";
import {
  sendSuccessResponse,
  sendErrorResponse,
  filterUserResponse,
  setAuthCookie,
  clearAuthCookie,
} from "../utils/responseUtils";

interface AuthRequest extends Request {
  user?: { userId: string };
}

class UserController {
  constructor(private _userService: UserService) {}

  private async handleAuthOperation(
    req: Request | AuthRequest,
    res: Response,
    operation: (data: any) => Promise<{ user: any; accessToken: string; refreshToken: string }>
  ) {
    try {
      const result = await operation(req.body);
      const { user, accessToken, refreshToken } = result;

      setAuthCookie(res, accessToken, refreshToken);

      const filteredUser = filterUserResponse(user);

      sendSuccessResponse(res, {
        message: "Operation successful",
        data: { user: filteredUser },
      });
    } catch (error: any) {
      sendErrorResponse(res, error);
    }
  }

  private async handleOtpOperation(
    req: Request,
    res: Response,
    operation: (data: any) => Promise<any>
  ) {
    try {
      const result = await operation(req.body);
      
      sendSuccessResponse(res, {
        message: result.message || "Operation successful",
        data: result.email ? { email: result.email } : {},
      });
    } catch (error: any) {
      sendErrorResponse(res, error);
    }
  }

  async signUpUser(req: Request, res: Response): Promise<void> {
    await this.handleOtpOperation(req, res, (data) =>
      this._userService.initiateSignUp({
        email: data.email,
        password: data.password,
        userName: data.userName,
        fullName: data.fullName,
      })
    );
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    await this.handleAuthOperation(req, res, (data) =>
      this._userService.verifyOtpAndCreateUser(data.email, data.otp)
    );
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    await this.handleOtpOperation(req, res, (data) =>
      this._userService.resendOtp(data.email)
    );
  }

  async loginUser(req: Request, res: Response): Promise<void> {
    console.log("it sloginnnnnnnnnnnnnnn");
    
    await this.handleAuthOperation(req, res, (data) =>
      this._userService.loginUser(data.email, data.password)
    );
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new Error("Unauthorized: No user ID found");

      await this._userService.logout(userId);
      clearAuthCookie(res);

      sendSuccessResponse(res, {
        message: "Logged out successfully",
      });
    } catch (error: any) {
      sendErrorResponse(res, error);
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    console.log("its forgot password controller");
    await this.handleOtpOperation(req, res, (data) =>
      this._userService.forgotPassword(data.email)
    );
  }
  
  async verifyForgotPasswordOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      await this._userService.verifyForgotPasswordOtp(email, otp);
      sendSuccessResponse(res, { 
        message: "OTP verified successfully",
        data: { email }
      });
    } catch (error: any) {
      sendErrorResponse(res, error);
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      console.log("tttttt",req.body);
      
      const { email, otp, newPassword } = req.body;
      if (!email  || !newPassword) {
        throw new Error("All fields are required");
      }
  
      await this._userService.resetPassword(email, otp, newPassword);
      sendSuccessResponse(res, { message: "Password reset successfully" });
    } catch (error: any) {
      sendErrorResponse(res, error);
    }
  }
  
}

export default UserController;