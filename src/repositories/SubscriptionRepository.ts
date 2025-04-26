//Backend\src\repositories\SubscriptionRepository.ts
import { Types } from "mongoose";
import Subscription from "../models/SubscriptionModel";
import { ISubscription } from "../types/ISubscription";
import { ISubscriptionRepository } from "../interfaces/repositoryInterfaces/ISubscriptionRepository";

export default class SubscriptionRepository implements ISubscriptionRepository {
  async create(subscription: Partial<ISubscription>): Promise<ISubscription> {
    const newSubscription = await Subscription.create(subscription);
    return newSubscription.toObject();
  }

  async findByUserId(userId: string): Promise<ISubscription | null> {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }
    return await Subscription.findOne({ userId: new Types.ObjectId(userId) }).lean().exec();
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<ISubscription | null> {
    return await Subscription.findOne({ stripeSubscriptionId }).lean().exec();
  }

  async update(subscriptionId: string, update: Partial<ISubscription>): Promise<ISubscription | null> {
    if (!Types.ObjectId.isValid(subscriptionId)) {
      return null;
    }
    return await Subscription.findByIdAndUpdate(new Types.ObjectId(subscriptionId), update, { new: true }).lean().exec();
  }
}