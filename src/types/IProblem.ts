import { Document, Types } from "mongoose";

export interface IProblem extends Document {
  solved: any;
  isPremium: any;
  _id: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  slug: string;
  solvedCount: number;
  status: "premium" | "free";
  isBlocked: Boolean;
  createdAt: Date;
  updatedAt: Date;
  testCaseIds: Types.ObjectId[];
  defaultCodeIds: Types.ObjectId[];
  memory: number; 
  time: number; 
}