// Backend\src\repositories\RefreshTokenRepository.ts
import redisClient from "../utils/redis";
import { IRefreshTokenRepository } from "../interfaces/IRefreshTokenRepository";

class RefreshTokenRepository implements IRefreshTokenRepository {
  private readonly TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days
  private readonly PREFIX = "refreshToken:";

  private getUserKey(userId: string): string {
    return `${this.PREFIX}user:${userId}`;
  }

  async create(data: { userId: string; token: string }): Promise<void> {
    const userKey = this.getUserKey(data.userId);
    // Store the original token (not hashed) for verification
    await redisClient.set(userKey, data.token, { EX: this.TOKEN_EXPIRY_SECONDS });
  }

  async findByUserId(userId: string): Promise<string | null> {
    return await redisClient.get(this.getUserKey(userId));
  }

  async findByToken(token: string): Promise<string | null> {
    // Optional: If you still want to support token-to-user lookup, you'd need a separate mapping
    // For simplicity, we'll skip this since it's not used in the current flow
    throw new Error("findByToken not implemented in this flow");
  }

  async updateToken(userId: string, newToken: string): Promise<void> {
    const userKey = this.getUserKey(userId);
    await redisClient.set(userKey, newToken, { EX: this.TOKEN_EXPIRY_SECONDS });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await redisClient.del(this.getUserKey(userId));
  }

  async deleteByToken(token: string): Promise<void> {
    // Optional: If you add a token-to-user mapping, implement this
    throw new Error("deleteByToken not implemented in this flow");
  }
}

export default RefreshTokenRepository;