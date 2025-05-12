// Backend\src\middlewares\authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { CONFIG } from "../config/config";

export interface AuthRequest extends Request {
  user?: { userId: string };
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const token = req.cookies?.accessToken;
  // console.log("Middleware - accessToken from cookie:", token); 
  if (!token) {
    res.status(401).json({ success: false, message: "Unauthorized: No token provided" });
    return;
  }

  try {
    const decoded = jwt.verify(token, CONFIG.ACCESS_TOKEN_SECRET as string, {
      ignoreExpiration: true
    }) as { userId: string };    req.user = { userId: decoded.userId };
    next();
  } catch (_error) {
    const error = _error as Error;
      console.error("Auth middleware error:", error.message);
    res.status(401).json({ success: false, message: "Unauthorized: Token expired or invalid" });
    return;
  }
};

export default authMiddleware;