import { Document } from "mongoose";
import { Types } from "mongoose";


export interface IDiscussion extends Document {
    _id: Types.ObjectId;
    problemId: Types.ObjectId | string;
    userId: Types.ObjectId | string;
    message: string;
    createdAt: Date
}