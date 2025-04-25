
//Backend\src\types\ISubscription.ts
import { Types } from "mongoose";

export interface ISubscription {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  planId: string;
  status: "incomplete" | "incomplete_expired" | "trialing" | "active" | "past_due" | "canceled" | "unpaid";
  currentPeriodEnd: Date;
  createdAt?: Date;
  updatedAt?: Date;
}