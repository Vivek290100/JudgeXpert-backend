import { Document } from "mongoose";
import { Types } from "mongoose";

export interface IDiscussion extends Document {
  _id: Types.ObjectId;
  problemId: Types.ObjectId | string;
  userId: Types.ObjectId | string | { _id: Types.ObjectId; userName: string; profileImage?: string };
  message: string;
  upvotes: number;
  downvotes: number;
  upvotedBy: Types.ObjectId[];
  score: number;
  replies: {
    userId: Types.ObjectId | string | { _id: Types.ObjectId; userName: string; profileImage?: string };
    message: string;
    createdAt: Date;
    upvotes: number;
    downvotes: number;
    upvotedBy: Types.ObjectId[];
    score: number;
  }[];
  createdAt: Date;
}