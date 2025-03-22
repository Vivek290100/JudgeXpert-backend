// Backend\src\utils\jwt.ts
import jwt from "jsonwebtoken";
import { CONFIG } from "../config/Config";

class JWTService {
  static generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, CONFIG.ACCESS_TOKEN_SECRET, { expiresIn: "59m" });
  }

  static generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, CONFIG.REFRESH_TOKEN_SECRET, { expiresIn: "30d" });
  }

  static verifyToken(token: string, type: "access" | "refresh"): { userId: string } {
    const secret = type === "access" ? CONFIG.ACCESS_TOKEN_SECRET : CONFIG.REFRESH_TOKEN_SECRET;
    if (!secret) {
      throw new Error("Secret not found for token type.");
    }
    try {
      return jwt.verify(token, secret) as { userId: string };
    } catch (error) {
      throw new Error("Token verification failed");
    }
  }
}

export default JWTService;