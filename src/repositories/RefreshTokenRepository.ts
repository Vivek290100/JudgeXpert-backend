// Backend\src\repositories\RefreshTokenRepository.ts
import { IRefreshTokenRepository } from "../interfaces/repositoryInterfaces/IRefreshTokenRepository";
import { IRedisService } from "../interfaces/utilInterfaces/IRedisService";

class RefreshTokenRepository implements IRefreshTokenRepository {
  private readonly TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days
  private readonly PREFIX = "refreshToken:";

  constructor(private redisService: IRedisService) {}

  private getUserKey(userId: string): string {
    return `${this.PREFIX}user:${userId}`;
  }

  async create(data: { userId: string; token: string }): Promise<void> {
    const userKey = this.getUserKey(data.userId);
    await this.redisService.set(userKey, data.token, { EX: this.TOKEN_EXPIRY_SECONDS });
  }

  async findByUserId(userId: string): Promise<string | null> {
    return await this.redisService.get(this.getUserKey(userId));
  }

  async findByToken(token: string): Promise<string | null> {

    throw new Error("findByToken not implemented in this flow");
  }

  async updateToken(userId: string, newToken: string): Promise<void> {
    const userKey = this.getUserKey(userId);
    await this.redisService.set(userKey, newToken, { EX: this.TOKEN_EXPIRY_SECONDS });
  }

  async deleteByUserId(userId: string): Promise<void> {
    await this.redisService.del(this.getUserKey(userId));
  }

  async deleteByToken(token: string): Promise<void> {
    throw new Error("deleteByToken not implemented in this flow");
  }
}

export default RefreshTokenRepository;