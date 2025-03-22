export interface IJWTService {
    generateAccessToken(userId: string): string;
    generateRefreshToken(userId: string): string;
    verifyToken(token: string, type: "access" | "refresh"): { userId: string };
  }