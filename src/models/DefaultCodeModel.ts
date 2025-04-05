import { model, Schema } from "mongoose";
import { IDefaultCode } from "../types/IDefaultCode";
import { SUPPORTED_LANGUAGES } from "../utils/languages";

const defaultCodeSchema = new Schema<IDefaultCode>(
  {
    languageName: { type: String, required: false },
    problemId: { type: Schema.Types.ObjectId, ref: "Problem", required: true },
    code: { type: String, required: true },
    status: { type: String, enum: ["active", "inactive", "pending"], default: "active" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export default model<IDefaultCode>("DefaultCode", defaultCodeSchema);