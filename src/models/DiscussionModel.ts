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
    upvotes: {
      type: Number,
      default: 0,
    },
    downvotes: {
      type: Number,
      default: 0,
    },
    upvotedBy: [{
      type: Schema.Types.ObjectId,
      ref: "User",
    }],
    score: {
      type: Number,
      default: 0,
    },
    replies: [
      {
        userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
        message: { type: String, required: true, trim: true, maxlength: 1000 },
        createdAt: { type: Date, default: Date.now },
        upvotes: { type: Number, default: 0 },
        downvotes: { type: Number, default: 0 },
        upvotedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
        score: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

discussionSchema.index({ problemId: 1, createdAt: -1 });
discussionSchema.index({ "replies.createdAt": -1 });

const Discussion = model<IDiscussion>("Discussion", discussionSchema);
export default Discussion;