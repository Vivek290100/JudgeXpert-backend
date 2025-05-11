import { model, Schema } from "mongoose";

const contestSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  problems: [{ type: Schema.Types.ObjectId, ref: "Problem" }],
  participants: [{ type: Schema.Types.ObjectId, ref: "User" }],
  isActive: { type: Boolean, default: true },
  winner: { type: Schema.Types.ObjectId, ref: "User", default: null },
  // createdAt: { type: Date, default: Date.now },
  // updatedAt: { type: Date, default: Date.now },
  isBlocked: { type: Boolean, default: false }, // Added default value
},{ timestamps: true }
);

export default model("Contest", contestSchema);