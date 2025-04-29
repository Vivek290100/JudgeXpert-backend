import { Document, Types } from "mongoose";

export interface IProblem extends Document {
  _id: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  slug: string;
  functionName: string;
  inputStructure: { name: string; type: string }[];
  outputStructure: { name: string; type: string }[];
  solvedCount: number;
  status: "premium" | "free";
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
  testCaseIds: Types.ObjectId[];
  defaultCodeIds: Types.ObjectId[];
  memory: number;
  time: number;
  solved?: boolean;
  isPremium?: boolean;
}