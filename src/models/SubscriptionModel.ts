//Backend\src\models\SubscriptionModel.ts
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
  status: {
    type: String,
    required: true,
    enum: ["active", "canceled", "past_due", "unpaid", "incomplete"],
  },
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