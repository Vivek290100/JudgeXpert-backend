import { model, Schema } from "mongoose";
import { ITestCase } from "../interfaces/ITestCase";

const testCaseSchema = new Schema<ITestCase>({
  problemId: { type: Schema.Types.ObjectId, ref: "Problem", required: true },
  input: { type: String, required: true },
  output: { type: String, required: true },
  index: { type: Number, required: true },
  status: { type: String, enum: ["active", "inactive", "pending"], default: "active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true, // Automatically manage createdAt and updatedAt
});

export default model<ITestCase>("TestCase", testCaseSchema);