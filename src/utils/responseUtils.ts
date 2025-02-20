// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\utils\responseUtils.ts
import { Request, Response } from "express";

// Interface for standardized response data
interface ResponseData {
  success: boolean;
  message?: string;
  data?: any;
  status?: number;
}

// Common success response handler
export const sendSuccessResponse = (
  res: Response,
  data: Partial<ResponseData> = {},
  status: number = 200
) => {
  res.status(status).json({
    success: true,
    message: data.message || "Operation successful",
    data: data.data || null,
  });
};

// Common error response handler
export const sendErrorResponse = (
  res: Response,
  error: any,
  status: number = 400
) => {
  res.status(status).json({
    success: false,
    message: error.message || "An error occurred",
  });
};

// Helper to filter user data for responses
export const filterUserResponse = (user: any) => ({
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
});

// Helper to set authentication cookie
export const setAuthCookie = (
  res: Response,
  accessToken: string,
  refreshToken?: string
) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

//   if (refreshToken) {
//     res.cookie("refreshToken", refreshToken, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === "production",
//       sameSite: "strict",
//       maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
//     });
//   }
};

// Helper to clear authentication cookie
export const clearAuthCookie = (res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });
};