import { Document } from "mongoose";
import { Types } from "mongoose";

export interface IDiscussion extends Document {
  _id: Types.ObjectId;
  problemId: Types.ObjectId | string;
  userId: Types.ObjectId | string | { _id: Types.ObjectId; userName: string }; // Allow populated user object
  message: string;
  replies: {
    userId: Types.ObjectId | string | { _id: Types.ObjectId; userName: string };
    message: string;
    createdAt: Date;
  }[];
  createdAt: Date;
}