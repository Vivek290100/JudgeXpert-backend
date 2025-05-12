import jwt from "jsonwebtoken";
import { IJWTService } from "../interfaces/utilInterfaces/IJWTService";

class JWTService implements IJWTService {
  constructor(
    private accessTokenSecret: string,
    private refreshTokenSecret: string
  ) {}

  generateAccessToken(userId: string): string {
    return jwt.sign({ userId }, this.accessTokenSecret, { expiresIn: "1h" });
  }

  generateRefreshToken(userId: string): string {
    return jwt.sign({ userId }, this.refreshTokenSecret, { expiresIn: "30d" });
  }

  verifyToken(token: string, type: "access" | "refresh"): { userId: string } {
    const secret = type === "access" ? this.accessTokenSecret : this.refreshTokenSecret;
    if (!secret) {
      throw new Error("Secret not found for token type.");
    }
    try {
      return jwt.verify(token, secret) as { userId: string };
    } catch (_error) {
      const error = _error as Error;
      console.error("Admin service error:", error.message);
      throw new Error("Token verification failed");
    }
  }
}

export default JWTService;