// Backend\src\interfaces\IUser.ts
import { Document, Schema, Types } from "mongoose";

export interface IUser extends Document {
  _id: string | Types.ObjectId;
  userName: string;
  email: string;
  password?: string;
  fullName?: string;
  role: "user" | "admin";
  profileImage: string,
  joinedDate?: Date;
  problemsSolved: number;
  rank: number;
  isBlocked: boolean;
  isPremium: boolean;
  googleId?: string;
  isGoogleAuth: boolean;
  github?: string;      
  linkedin?: string;
}


