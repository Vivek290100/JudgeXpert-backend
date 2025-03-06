import { Response } from "express";

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

// to set authentication cookie
export const setAuthCookie = (
  res: Response,
  accessToken: string,
  refreshToken?: string
) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 59 * 60 * 1000,
  });

};

// to clear authentication cookie
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