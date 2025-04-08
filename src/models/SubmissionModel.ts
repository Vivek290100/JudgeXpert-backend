// Backend\src\models\SubmissionModel.ts
import { model, Schema } from "mongoose";
import { ISubmission } from "../types/ISubmission";

const submissionSchema = new Schema<ISubmission>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  problemId: { type: Schema.Types.ObjectId, ref: "Problem", required: true },
  language: { type: String, required: true },
  code: { type: String, required: true },
  results: [{
    testCaseIndex: { type: Number, required: true },
    input: { type: String, required: true },
    expectedOutput: { type: String, required: true },
    actualOutput: { type: String, required: true },
    stderr: { type: String, default: "" },
    passed: { type: Boolean, required: true },
  }],
  passed: { type: Boolean, required: true },
  submittedAt: { type: Date, default: Date.now },
  isRunOnly: { type: Boolean, default: false },
  executionTime: { type: Number, default: 0 },
  contestId: { type: Schema.Types.ObjectId, ref: "Contest", default: null },
}, { timestamps: true });

export default model<ISubmission>("Submission", submissionSchema);