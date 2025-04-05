import { model, Schema } from "mongoose";
import { IProblem } from "../types/IProblem";

const problemSchema = new Schema<IProblem>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    difficulty: { type: String, enum: ["EASY", "MEDIUM", "HARD"], default: "MEDIUM" },
    slug: { type: String, required: true, unique: true },
    functionName: { type: String, required: true },
    inputStructure: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
    outputStructure: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
      },
    ],
    solvedCount: { type: Number, default: 0 },
    status: { type: String, enum: ["premium", "free"], default: "free" },
    isBlocked: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    testCaseIds: [{ type: Schema.Types.ObjectId, ref: "TestCase" }],
    defaultCodeIds: [{ type: Schema.Types.ObjectId, ref: "DefaultCode" }],
    memory: { type: Number, default: 256 },
    time: { type: Number, default: 1000 },
    solved: { type: Boolean, default: false, required: false },
    isPremium: { type: Boolean, default: false, required: false },
  },
  { timestamps: true }
);

const Problem = model<IProblem>("Problem", problemSchema);
export default Problem;