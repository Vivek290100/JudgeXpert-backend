// UserController.ts
import { Request, Response } from "express";
import { sendResponse, handleError, setAuthCookie, clearAuthCookie, filterUserResponse } from "../utils/responseUtils";
import { IUserService } from "../interfaces/IUserService";
import { StatusCode, CommonErrors } from "../utils/errors";

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
        status: StatusCode.CREATED,
        message: result.message || "Sign-up initiated successfully",
        data: result.email ? { email: result.email } : {},
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async verifyOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      const result = await this._userService.verifyOtpAndCreateUser(email, otp);
      const { user, accessToken } = result;

      setAuthCookie(res, accessToken);
      const filteredUser = filterUserResponse(user);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: "OTP verified and user created successfully",
        data: { user: filteredUser, accessToken },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async resendOtp(req: Request, res: Response): Promise<void> {
    try {
      const result = await this._userService.resendOtp(req.body.email);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: result.message || "OTP resent successfully",
        data: result.email ? { email: result.email } : {},
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async loginUser(req: Request, res: Response): Promise<void> {
    try {
      console.log("==req.body===", req.body);
      const { email, password } = req.body;
      const result = await this._userService.loginUser(email, password);
      console.log("==result===", result);
      const { user, accessToken, refreshToken } = result;

      setAuthCookie(res, accessToken);
      const filteredUser = filterUserResponse(user);

      console.log("kkkkkkk", filteredUser, accessToken, user._id);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: "Login successful",
        data: { user: filteredUser, accessToken, userId: user._id.toString() },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { credential } = req.body;
      if (!credential) {
        throw CommonErrors.GOOGLE_CREDENTIAL_REQUIRED();
      }

      const result = await this._userService.googleLogin(credential);
      const { user, accessToken } = result;

      setAuthCookie(res, accessToken);
      const filteredUser = filterUserResponse(user);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: "Google login successful",
        data: { user: filteredUser, accessToken },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw CommonErrors.UNAUTHORIZED_ACCESS();

      await this._userService.logout(userId);
      clearAuthCookie(res);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: "Logged out successfully",
        data: null,
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const result = await this._userService.forgotPassword(req.body.email);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: result.message || "Password reset initiated successfully",
        data: result.email ? { email: result.email } : {},
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async verifyForgotPasswordOtp(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp } = req.body;
      await this._userService.verifyForgotPasswordOtp(email, otp);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: "OTP verified successfully, Now you can enter new and confirm password",
        data: { email },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email, otp, newPassword } = req.body;
      if (!email || !newPassword) {
        throw CommonErrors.ALL_FIELDS_REQUIRED();
      }

      await this._userService.resetPassword(email, otp, newPassword);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: "Password reset successfully",
        data: null,
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw CommonErrors.UNAUTHORIZED_ACCESS();

      const { fullName, github, linkedin } = req.body;
      const profileImage = req.file;

      const updatedUser = await this._userService.updateProfile({
        userId,
        fullName,
        github,
        linkedin,
        profileImage,
      });

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: "Profile updated successfully",
        data: { user: filterUserResponse(updatedUser) },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.body;
      if (!userId) {
        throw CommonErrors.USER_ID_REQUIRED();
      }

      const { accessToken: newAccessToken } = await this._userService.refreshAccessToken(userId);

      setAuthCookie(res, newAccessToken);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: "Token refreshed successfully",
        data: { accessToken: newAccessToken },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }
}

export default UserController;