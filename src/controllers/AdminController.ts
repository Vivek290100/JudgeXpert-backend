import { Request, Response } from "express";
import { handleError, sendResponse } from "../utils/responseUtils";
import { IAdminService } from "../interfaces/serviceInterfaces/IAdminService";
import { StatusCode } from "../utils/statusCode";
import { SuccessMessages } from "../utils/messages";
import { BadRequestError, ErrorMessages, NotFoundError } from "../utils/errors";

class AdminController {
  constructor(private adminService: IAdminService) {}

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = (req.query.search as string) || "";
      const { users, total } = await this.adminService.getAllUsers(page, limit, search);

      const adminUsers = users.map((user) => ({
        id: user._id.toString(),
        email: user.email,
        userName: user.userName,
        fullName: user.fullName,
        role: user.role,
        isBlocked: user.isBlocked,
        joinedDate: user.joinedDate?.toISOString() ?? new Date().toISOString(),
        isPremium: user.isPremium || false,
      }));

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.USERS_FETCHED,
        data: {
          users: adminUsers,
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      if (!userId) {
        throw new BadRequestError(ErrorMessages.USER_ID_REQUIRED);
      }

      const user = await this.adminService.getUserById(userId);
      if (!user) {
        throw new NotFoundError(ErrorMessages.USER_NOT_FOUND);
      }

      const adminUser = {
        id: user._id.toString(),
        email: user.email,
        userName: user.userName,
        fullName: user.fullName,
        role: user.role,
        isBlocked: user.isBlocked,
        joinedDate: user.joinedDate?.toISOString() ?? new Date().toISOString(),
      };

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.USER_FETCHED,
        data: { user: adminUser },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      if (!userId) {
        throw new BadRequestError(ErrorMessages.USER_ID_REQUIRED);
      }

      const updatedUser = await this.adminService.blockUser(userId);
      const adminUser = {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        userName: updatedUser.userName,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        isBlocked: updatedUser.isBlocked,
        joinedDate: updatedUser.joinedDate?.toISOString() ?? new Date().toISOString(),
      };

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.USER_BLOCKED,
        data: { user: adminUser },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async unblockUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      if (!userId) {
        throw new BadRequestError(ErrorMessages.USER_ID_REQUIRED);
      }

      const updatedUser = await this.adminService.unblockUser(userId);
      const adminUser = {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        userName: updatedUser.userName,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        isBlocked: updatedUser.isBlocked,
        joinedDate: updatedUser.joinedDate?.toISOString() ?? new Date().toISOString(),
      };

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: SuccessMessages.USER_UNBLOCKED,
        data: { user: adminUser },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }

  async toggleBlockUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, isBlocked } = req.body;
      if (!userId || typeof isBlocked !== "boolean") {
        throw new BadRequestError(ErrorMessages.INVALID_REQUEST_PAYLOAD("userId and isBlocked"));
      }

      const updatedUser = isBlocked
        ? await this.adminService.blockUser(userId)
        : await this.adminService.unblockUser(userId);

      const adminUser = {
        id: updatedUser._id.toString(),
        email: updatedUser.email,
        userName: updatedUser.userName,
        fullName: updatedUser.fullName,
        role: updatedUser.role,
        isBlocked: updatedUser.isBlocked,
        joinedDate: updatedUser.joinedDate?.toISOString() ?? new Date().toISOString(),
      };

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: isBlocked ? SuccessMessages.USER_BLOCKED : SuccessMessages.USER_UNBLOCKED,
        data: { user: adminUser },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }
}

export default AdminController;