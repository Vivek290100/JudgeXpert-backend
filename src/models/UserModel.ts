// Backend\src\models\UserModel.ts
import { Schema, model } from "mongoose";
import { IUser } from "../interfaces/IUser";

const userSchema = new Schema<IUser>({
  userName: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String},
  fullName: { type: String },
  role: { type: String, default: "user" },
  profileImage: { type: String, default: "" },
  joinedDate: { type: Date, default: Date.now },
  problemsSolved: { type: Number, default: 0 },  
  rank: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  isPremium: { type: Boolean, default: false },
  isGoogleAuth: { type: Boolean, default: false },
  github: { type: String },
  linkedin: { type: String },
  
});

const User = model<IUser>("User", userSchema);
export default User;
