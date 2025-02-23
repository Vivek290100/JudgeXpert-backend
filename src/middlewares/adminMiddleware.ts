// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\middlewares\adminMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config/config";
import { Dependencies } from "../utils/dependencies";
import { sendResponse } from "../utils/responseUtils";

interface AuthRequest extends Request {
  user?: { userId: string; role: string };
}

const adminMiddleware = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.accessToken;
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
    if (!decoded.userId) {
      throw new Error("Invalid token payload");
    }

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
  } catch (error) {
    sendResponse(res, {
      success: false,
      message: "Forbidden: Invalid or expired token",
      status: 403,
    });
    return;
  }
};

export default adminMiddleware;