import { Document } from "mongoose";

export interface IRefreshToken extends Document {
  userId: string;
  token: string;
}

export interface IRefreshTokenRepository {
  create(data: { userId: string; token: string }): Promise<IRefreshToken>;
  findByUserId(userId: string): Promise<IRefreshToken | null>;
  findByToken(token: string): Promise<IRefreshToken | null>;
  updateToken(userId: string, newToken: string): Promise<IRefreshToken | null>;
  deleteByUserId(userId: string): Promise<any>;
  deleteByToken(token: string): Promise<IRefreshToken | null>;
}