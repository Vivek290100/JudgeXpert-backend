import { Schema, model } from "mongoose";
import { IDiscussion } from "../types/IDiscussion";

const discussionSchema = new Schema<IDiscussion>(
  {
    problemId: {
      type: Schema.Types.ObjectId,
      ref: "Problem",
      required: true,
      index: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 1000,
    },
    replies: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true, trim: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const Discussion = model<IDiscussion>("Discussion", discussionSchema);
export default Discussion;