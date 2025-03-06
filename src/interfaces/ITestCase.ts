import { Document, Types } from "mongoose";

export interface ITestCase extends Document {
  _id: Types.ObjectId;
  problemId: Types.ObjectId; 
  input: string;
  output: string;
  index: number;
  status: "active" | "inactive" | "pending"; 
  createdAt: Date;
  updatedAt: Date;
}