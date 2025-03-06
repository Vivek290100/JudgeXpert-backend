// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\interfaces\IUser.ts
import { Document, Schema, Types } from "mongoose";

export interface IUser extends Document {
  _id: string;
  userName: string;
  email: string;
  password: string;
  fullName?: string;
  role: string,
  profileImage: string,
  joinedDate?: Date;
  problemsSolved: [{equals(_id: string): unknown; type: Schema.Types.ObjectId, ref: "Problem"}],
  rank: number;
  isBlocked: boolean;
  isPremium: boolean;
  isGoogleAuth: boolean;
  github?: string;      
  linkedin?: string;
}


