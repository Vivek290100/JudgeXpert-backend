import { Response } from "express";
import { AppError } from "./errors";
import { StatusCode } from "./statusCode";

interface ResponseData {
  success: boolean;
  message: string;
  status: number;
  data?: any;
}

export const sendResponse = (
  res: Response,
  options: ResponseData
) => {
  res.status(options.status).json({
    success: options.success,
    message: options.message,
    data: options.data || null,
  });
};


export const handleError = (res: Response, error: AppError | Error) => {
  if (error instanceof AppError) {
    sendResponse(res, {
      success: false,
      message: error.message,
      status: error.statusCode,
      data: error.details,
    });
  } else {
    sendResponse(res, {
      success: false,
      message: "Internal Server Error",
      status: StatusCode.INTERNAL_SERVER_ERROR,
      data: null,
    });
  }
};


export const filterUserResponse = (user: any) => ({
  id: user._id.toString(),
  userName: user.userName,
  fullName: user.fullName || "",
  email: user.email,
  profileImage:
    user.profileImage ||
    "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?fit=crop&w=32&h=32",
  role: user.role,
  joinedDate: user.joinedDate,
  problemsSolved: user.problemsSolved ?? 0,
  rank: user.rank ?? 0,
  isPremium: user.isPremium ?? false,
  isGoogleAuth: user.isGoogleAuth ?? false,
  github: user.github || "",
  linkedin: user.linkedin || "",
});

export const setAuthCookie = (res: Response, accessToken: string): void => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: "lax",
    path: "/",
  });
};

export const clearAuthCookie = (res: Response) => {
  res.clearCookie("accessToken", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
  });

};