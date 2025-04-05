import { Document, Types } from "mongoose";

export interface ITestCase extends Document {
  _id: Types.ObjectId;
  problemId: Types.ObjectId;
  inputs: { name: string; type: string; value: any }[];
  outputs: { name: string; type: string; value: any }[];
  index: number;
  status: "active" | "inactive" | "pending";
  createdAt: Date;
  updatedAt: Date;
}