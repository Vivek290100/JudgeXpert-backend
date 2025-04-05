import { Document, Types } from "mongoose";

export interface IDefaultCode extends Document {
  _id: Types.ObjectId;
  languageName?: string;
  problemId: Types.ObjectId;
  code: string;
  status: "active" | "inactive" | "pending";
  createdAt: Date;
  updatedAt: Date;
}