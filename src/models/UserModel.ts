import { Schema, model } from "mongoose";
import { IUser } from "../interfaces/IUser";

const userSchema = new Schema<IUser>({
  userName: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String },
  role: { type: String, default: "user" },
  profileImage: { type: String, default: "" },
  joinedDate: { type: Date, default: Date.now },
  problemsSolved: { type: Number, default: 0 },
  rank: { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  subscription: { type: Schema.Types.ObjectId, ref: "Subscription" },
  solvedProblems: [{ type: Schema.Types.ObjectId, ref: "SolvedProblem" }],
  submissions: [{ type: Schema.Types.ObjectId, ref: "Submission" }],
  contestParticipations: [
    { type: Schema.Types.ObjectId, ref: "ContestParticipation" },
  ],
});

const User = model<IUser>("User", userSchema);
export default User;
