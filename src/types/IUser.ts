import { Document, Types } from "mongoose";

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
  solvedProblems: Types.ObjectId[] | string[];
  rank: number;
  isBlocked: boolean;
  isPremium: boolean;
  googleId?: string;
  isGoogleAuth: boolean;
  github?: string;      
  linkedin?: string;
  stripeCustomerId?: string;
  subscriptionEnd?: Date;
}


