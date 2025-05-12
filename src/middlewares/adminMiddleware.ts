// Backend\src\middlewares\adminMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config/config";
import { Dependencies } from "../utils/dependencies";
import { sendResponse } from "../utils/responseUtils";

export interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.accessToken;
  // console.log("Middleware - Cookies received:", req.cookies);
  if (!token) {
    sendResponse(res, {
      success: false,
      message: "Unauthorized: No token provided",
      status: 401,
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, CONFIG.ACCESS_TOKEN_SECRET as string) as { userId: string };
    const user = await Dependencies.userRepository.findById(decoded.userId);
    if (!user) {
      sendResponse(res, {
        success: false,
        message: "Forbidden: User not found",
        status: 403,
      });
      return;
    }

    if (user.role !== "admin") {
      sendResponse(res, {
        success: false,
        message: "Forbidden: Admin access required",
        status: 403,
      });
      return;
    }
    req.user = { userId: decoded.userId, role: user.role };
    next();
  } catch (_error) {
    const error = _error as Error;
    console.error("Admin middleware error:", error.message);
    sendResponse(res, {
      success: false,
      message: "Unauthorized: Token expired or invalid",
      status: 401,
    });
    return;
  }
};

export default adminMiddleware;