export interface IRefreshTokenRepository {
  create(data: { userId: string; token: string }): Promise<void>;
  findByUserId(userId: string): Promise<string | null>; 
  findByToken(token: string): Promise<string | null>; 
  updateToken(userId: string, newToken: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
  deleteByToken(token: string): Promise<void>;
}