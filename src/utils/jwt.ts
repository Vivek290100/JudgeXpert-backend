// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\utils\jwt.ts
import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

class JWTService {
  static generateAccessToken(userId: string) {
    return jwt.sign({ userId }, process.env.ACCESS_TOKEN_SECRET as string, {
      expiresIn: "30m",
    });
  }
  static generateRefreshToken(userId: string) {
    return jwt.sign({ userId }, process.env.REFRESH_TOKEN_SECRET as string, {
      expiresIn: "7d",
    });
  }
  static verifyToken(token: string, type: "access" | "refresh") {
    const secret =
      type === "access"
        ? process.env.ACCESS_TOKEN_SECRET
        : process.env.REFRESH_TOKEN_SECRET;
    if (!secret) {
      throw new Error("Secret not found for token type.");
    }
    return jwt.verify(token, secret);
  }
}
export default JWTService;
