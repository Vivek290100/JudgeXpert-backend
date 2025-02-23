import { Request, Response } from "express";
import { sendResponse } from "../utils/responseUtils";
import AdminService from "../services/AdminService";

class AdminController {
  constructor(private adminService: AdminService) {}

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
        status: 200,
        message: "Users fetched successfully",
        data: {
          users: adminUsers,
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: page,
        },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 500,
        message: error.message || "Failed to fetch users",
        data: null,
      });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      const user = await this.adminService.getUserById(userId);
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
        status: 200,
        message: "User fetched successfully",
        data: { user: adminUser },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 404,
        message: error.message || "User not found",
        data: null,
      });
    }
  }

  async blockUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
      console.log("useriddddd",userId);
      
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
        status: 200,
        message: "User blocked successfully",
        data: { user: adminUser },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 400,
        message: error.message || "Failed to block userrr",
        data: null,
      });
    }
  }

  async unblockUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.params.id;
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
        status: 200,
        message: "User unblocked successfully",
        data: { user: adminUser },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 400,
        message: error.message || "Failed to unblock user",
        data: null,
      });
    }
  }


  async toggleBlockUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId, isBlocked } = req.body;
      if (!userId || typeof isBlocked !== "boolean") {
        throw new Error("Invalid request payload");
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
        status: 200,
        message: `User ${isBlocked ? "blocked" : "unblocked"} successfully`,
        data: { user: adminUser },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: 400,
        message: error.message || "Failed to update user block status",
        data: null,
      });
    }
  }
}

export default AdminController;