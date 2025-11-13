import { model, Schema } from "mongoose";
import { ISubscription } from "../types/ISubscription";

const subscriptionSchema = new Schema<ISubscription>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  stripeCustomerId: {
    type: String,
    required: true,
  },
  stripeSubscriptionId: {
    type: String,
    required: true,
    unique: true,
  },
  planId: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ["active", "canceled", "incomplete", "incomplete_expired", "past_due", "trialing", "unpaid"],  },
  currentPeriodEnd: {
    type: Date,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

subscriptionSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Subscription = model<ISubscription>("Subscription", subscriptionSchema);
export default Subscription;