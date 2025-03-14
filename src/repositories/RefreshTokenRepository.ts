import { IRefreshToken, IRefreshTokenRepository } from "../interfaces/IRefreshTokenRepository";
import RefreshTokenModel from "../models/RefreshTokenModel";
import crypto from "crypto";
import mongoose from "mongoose";

class RefreshTokenRepository implements IRefreshTokenRepository {
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  private toIRefreshToken(doc: any): IRefreshToken {
    if (!doc) return null as any;
    return {
      ...doc.toObject(),
      userId: doc.userId.toString(),
      _id: doc._id.toString(),
    };
  }

  async create(data: { userId: string; token: string }): Promise<IRefreshToken> {
    const hashedToken = this.hashToken(data.token);
    const doc = await RefreshTokenModel.create({
      userId: new mongoose.Types.ObjectId(data.userId),
      token: hashedToken,
    });
    return this.toIRefreshToken(doc);
  }

  async findByUserId(userId: string): Promise<IRefreshToken | null> {
    const doc = await RefreshTokenModel.findOne({
      userId: new mongoose.Types.ObjectId(userId),
    });
    return this.toIRefreshToken(doc);
  }

  async findByToken(token: string): Promise<IRefreshToken | null> {
    const hashedToken = this.hashToken(token);
    const doc = await RefreshTokenModel.findOne({ token: hashedToken });
    return this.toIRefreshToken(doc);
  }

  async updateToken(userId: string, newToken: string): Promise<IRefreshToken | null> {
    const hashedToken = this.hashToken(newToken);
    const doc = await RefreshTokenModel.findOneAndUpdate(
      { userId: new mongoose.Types.ObjectId(userId) },
      { token: hashedToken },
      { new: true }
    );
    return this.toIRefreshToken(doc);
  }

  async deleteByUserId(userId: string): Promise<any> {
    return await RefreshTokenModel.deleteMany({
      userId: new mongoose.Types.ObjectId(userId),
    });
  }

  async deleteByToken(token: string): Promise<IRefreshToken | null> {
    const hashedToken = this.hashToken(token);
    const doc = await RefreshTokenModel.findOneAndDelete({ token: hashedToken });
    return this.toIRefreshToken(doc);
  }
}

export default RefreshTokenRepository;