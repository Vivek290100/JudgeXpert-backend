import { Document, Types } from "mongoose";

export interface IContest extends Document {
  _id: Types.ObjectId;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  problems: Types.ObjectId[];
  participants: Types.ObjectId[];
  isActive: boolean;
  winner: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
  isBlocked: boolean;
}