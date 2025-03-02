import { Document, Types } from "mongoose";

export interface IDefaultCode extends Document {
  _id: Types.ObjectId;
  languageId: number; // Judge0 language ID
  languageName?: string; // Optional human-readable name for reference
  problemId: Types.ObjectId; // Reference to the Problem
  code: string;
  status: "active" | "inactive" | "pending"; // For future use (e.g., code status)
  createdAt: Date;
  updatedAt: Date;
}