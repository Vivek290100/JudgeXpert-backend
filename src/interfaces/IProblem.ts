import { Document, Types } from "mongoose";

export interface IProblem extends Document {
  _id: string;
  title: string;
  description: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  slug: string;
  solvedCount: number;
  status: "premium" | "free";
  createdAt: Date;
  updatedAt: Date;
  testCaseIds: Types.ObjectId[]; // References to TestCase documents
  defaultCodeIds: Types.ObjectId[]; // References to DefaultCode documents
  memory: number; // Maximum memory limit (in KB or MB, e.g., for Judge0)
  time: number; // Maximum time limit (in milliseconds or seconds, e.g., for Judge0)
  judge0TrackingId: string | null; // Optional tracking ID for Judge0 submissions (for future use)
}