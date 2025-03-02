import { model, Schema } from "mongoose";
import { IDefaultCode } from "../interfaces/IDefaultCode";
import { SUPPORTED_LANGUAGES } from "../config/Languages";

const defaultCodeSchema = new Schema<IDefaultCode>({
  languageId: { 
    type: Number, 
    required: true,
    validate: {
      validator: (v: number) => SUPPORTED_LANGUAGES.some(lang => lang.id === v),
      message: props => `${props.value} is not a valid Judge0 language ID`,
    },
  },
  languageName: { type: String, required: false }, // Optional for reference
  problemId: { type: Schema.Types.ObjectId, ref: "Problem", required: true },
  code: { type: String, required: true },
  status: { type: String, enum: ["active", "inactive", "pending"], default: "active" },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, {
  timestamps: true,
});

export default model<IDefaultCode>("DefaultCode", defaultCodeSchema);