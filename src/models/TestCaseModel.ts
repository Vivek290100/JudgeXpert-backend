import { model, Schema } from "mongoose";
import { ITestCase } from "../types/ITestCase";

const testCaseSchema = new Schema<ITestCase>(
  {
    problemId: { type: Schema.Types.ObjectId, ref: "Problem", required: true },
    inputs: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true },
      },
    ],
    outputs: [
      {
        name: { type: String, required: true },
        type: { type: String, required: true },
        value: { type: Schema.Types.Mixed, required: true },
      },
    ],
    index: { type: Number, required: true },
    status: { type: String, enum: ["active", "inactive", "pending"], default: "active" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model<ITestCase>("TestCase", testCaseSchema);