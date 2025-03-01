import mongoose from "mongoose";

const RefreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: "30d" }
});

const RefreshTokenModel = mongoose.model("RefreshToken", RefreshTokenSchema);
export default RefreshTokenModel;
