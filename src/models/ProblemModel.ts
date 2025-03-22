import { IProblem } from "../interfaces/IProblem";
import { model, Schema } from "mongoose";


const problemSchema = new Schema<IProblem>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  difficulty: { type: String, enum: ["EASY", "MEDIUM", "HARD"], default: "MEDIUM" },
  slug: { type: String, required: true, unique: true },
  solvedCount: { type: Number, default: 0 },
  status: { type: String, enum: ["premium", "free",], default: "free" },
  isBlocked: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  testCaseIds: [{ type: Schema.Types.ObjectId, ref: "TestCase" }],
  defaultCodeIds: [{ type: Schema.Types.ObjectId, ref: "DefaultCode" }],
  memory: { type: Number, default: 256 },
  time: { type: Number, default: 1000 }, 
  judge0TrackingId: { type: String, default: null },
}, { timestamps: true,});

const Problem = model<IProblem>("Problem", problemSchema);
export default Problem;