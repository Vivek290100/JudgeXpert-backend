import { Document, Types } from "mongoose";

export interface ITestCase extends Document {
  _id: Types.ObjectId;
  problemId: Types.ObjectId; // Reference to the Problem
  input: string;
  output: string;
  index: number;
  status: "active" | "inactive" | "pending"; // For future use (e.g., test case status)
  createdAt: Date;
  updatedAt: Date;
}