import { Request, Response } from "express";
import { sendResponse, handleError, setAuthCookie, clearAuthCookie, filterUserResponse } from "../utils/responseUtils";
import { IUserService } from "../interfaces/serviceInterfaces/IUserService";
import { StatusCode } from "../utils/statusCode";
import { SuccessMessages } from "../utils/messages";
import { BadRequestError, ErrorMessages, UnauthorizedError } from "../utils/errors";

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
        message: result.message || SuccessMessages.SIGNUP_INITIATED,
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
        message: SuccessMessages.OTP_VERIFIED_USER_CREATED,
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
        message: result.message || SuccessMessages.OTP_RESENT,
        data: result.email ? { email: result.email } : {},
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async loginUser(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const result = await this._userService.loginUser(email, password);
      const { user, accessToken, refreshToken } = result;

      setAuthCookie(res, accessToken);
      const filteredUser = filterUserResponse(user);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.LOGIN_SUCCESS,
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
        throw new BadRequestError(ErrorMessages.GOOGLE_CREDENTIAL_REQUIRED);
      }

      const result = await this._userService.googleLogin(credential);
      const { user, accessToken } = result;

      setAuthCookie(res, accessToken);
      const filteredUser = filterUserResponse(user);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.GOOGLE_LOGIN_SUCCESS,
        data: { user: filteredUser, accessToken },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async logout(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError(ErrorMessages.UNAUTHORIZED_ACCESS);

      await this._userService.logout(userId);
      clearAuthCookie(res);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.LOGOUT_SUCCESS,
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
        message: result.message || SuccessMessages.PASSWORD_RESET_INITIATED,
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
        message: SuccessMessages.OTP_VERIFIED,
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
        throw new BadRequestError(ErrorMessages.ALL_FIELDS_REQUIRED);
      }

      await this._userService.resetPassword(email, otp, newPassword);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.PASSWORD_RESET_SUCCESS,
        data: null,
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) throw new UnauthorizedError(ErrorMessages.UNAUTHORIZED_ACCESS);

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
        message: SuccessMessages.PROFILE_UPDATED,
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
        throw new BadRequestError(ErrorMessages.USER_ID_REQUIRED);
      }

      const { accessToken: newAccessToken } = await this._userService.refreshAccessToken(userId);

      setAuthCookie(res, newAccessToken);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.TOKEN_REFRESHED,
        data: { accessToken: newAccessToken },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }


  async getLeaderboard(req: Request, res: Response): Promise<void> {
    
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      if (page < 1 || limit < 1) {
        throw new BadRequestError(ErrorMessages.INVALID_PAGINATION_PARAMS);
      }

      const result = await this._userService.getLeaderboard(page, limit);

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.LEADERBOARD_FETCHED,
        data: {
          leaderboard: result.leaderboard,
          totalPages: result.totalPages,
          currentPage: result.currentPage,
        },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }
}

export default UserController;