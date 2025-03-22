// AdminController.ts
import { Request, Response } from "express";
import { handleError, sendResponse } from "../utils/responseUtils";
import { IAdminService } from "../interfaces/IAdminService";
import { StatusCode, CommonErrors } from "../utils/errors";

class AdminController {
  constructor(private adminService: IAdminService) {}

  async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const { users, total } = await this.adminService.getAllUsers(page, limit);

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
        message: "Users fetched successfully",
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
        throw CommonErrors.USER_ID_REQUIRED();
      }

      const user = await this.adminService.getUserById(userId);
      if (!user) {
        throw CommonErrors.USER_NOT_FOUND();
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
        message: "User fetched successfully",
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
        throw CommonErrors.USER_ID_REQUIRED();
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
        message: "User blocked successfully",
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
        throw CommonErrors.USER_ID_REQUIRED();
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
        message: "User unblocked successfully",
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
        throw CommonErrors.INVALID_REQUEST_PAYLOAD("userId and isBlocked");
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
        message: `User ${isBlocked ? "blocked" : "unblocked"} successfully`,
        data: { user: adminUser },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  }
}

export default AdminController;