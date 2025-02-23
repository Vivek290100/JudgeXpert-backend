// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\interfaces\IUser.ts
import { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: string;
  userName: string;
  email: string;
  password: string;
  fullName?: string;
  role: string,
  profileImage: string,
  joinedDate?: Date;
  problemsSolved: number;
  rank: number;
  isBlocked: boolean;
  isPremium: boolean;
  subscription?: Types.ObjectId;
  solvedProblems: Types.ObjectId[];
  submissions: Types.ObjectId[];
  contestParticipations: Types.ObjectId[];
}


