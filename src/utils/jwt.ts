// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\utils\jwt.ts
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { CONFIG } from "../config/config";

dotenv.config();

class JWTService {
  static generateAccessToken(userId: string) {
    return jwt.sign({ userId }, CONFIG.ACCESS_TOKEN_SECRET as string, { expiresIn: "59m",});
  }
  static generateRefreshToken(userId: string) {
     return jwt.sign({ userId }, CONFIG.REFRESH_TOKEN_SECRET as string, { expiresIn: "30d",});
  }
  static verifyToken(token: string, type: "access" | "refresh") {
    const secret = type === "access" ? CONFIG.ACCESS_TOKEN_SECRET : CONFIG.REFRESH_TOKEN_SECRET;
    if (!secret) {
      throw new Error("Secret not found for token type.");
    }
    return jwt.verify(token, secret);
  }
}
export default JWTService;
