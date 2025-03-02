import { IProblem } from "../interfaces/IProblem";
import { model, Schema } from "mongoose";
import TestCase from "./TestCaseModel";
import DefaultCode from "./DefaultCodeModel";

const problemSchema = new Schema<IProblem>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ["EASY", "MEDIUM", "HARD"], default: "MEDIUM" },
  slug: { type: String, required: true, unique: true },
  solvedCount: { type: Number, default: 0 },
  status: { type: String, enum: ["premium", "free",], default: "free" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  testCaseIds: [{ type: Schema.Types.ObjectId, ref: "TestCase" }],
  defaultCodeIds: [{ type: Schema.Types.ObjectId, ref: "DefaultCode" }],
  memory: { type: Number, default: 256 }, // Default memory limit (e.g., 256 KB)
  time: { type: Number, default: 1000 }, // Default time limit (e.g., 1 second)
  judge0TrackingId: { type: String, default: null }, // Optional for Judge0 integration
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
});

const Problem = model<IProblem>("Problem", problemSchema);
export default Problem;