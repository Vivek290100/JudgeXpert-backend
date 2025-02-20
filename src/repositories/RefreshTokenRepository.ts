// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\repositories\RefreshTokenRepository.ts
import RefreshTokenModel from "../models/RefreshTokenModel";
import crypto from "crypto";

class RefreshTokenRepository {
  private hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  async create(data: { userId: string; token: string }) {
    const hashedToken = this.hashToken(data.token);
    // console.log("Storing refresh token: ", data.token);
    // console.log("Hashed token: ", hashedToken);
    return await RefreshTokenModel.create({ userId: data.userId, token: hashedToken });
  }

  async findByUserId(userId: string) {
    return await RefreshTokenModel.findOne({ userId });
  }

  async findByToken(token: string) {
    // console.log("Looking for token:", token);
    const hashedToken = this.hashToken(token);
    // console.log("Hashed token:", hashedToken);
    return await RefreshTokenModel.findOne({ token: hashedToken });
  }

  async updateToken(userId: string, newToken: string) {
    const hashedToken = this.hashToken(newToken);
    return await RefreshTokenModel.findOneAndUpdate({ userId }, { token: hashedToken }, { new: true });
  }

  async deleteByUserId(userId: string) {
    return await RefreshTokenModel.deleteMany({ userId });
  }

  async deleteByToken(token: string) {
    const hashedToken = this.hashToken(token);
    return await RefreshTokenModel.findOneAndDelete({ token: hashedToken });
  }
}

export default RefreshTokenRepository;
