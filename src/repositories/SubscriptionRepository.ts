import { Types } from "mongoose";
import Subscription from "../models/SubscriptionModel";
import { ISubscription } from "../types/ISubscription";
import { ISubscriptionRepository } from "../interfaces/repositoryInterfaces/ISubscriptionRepository";

export default class SubscriptionRepository implements ISubscriptionRepository {
  async create(subscription: Partial<ISubscription>): Promise<ISubscription> {
    const newSubscription = await Subscription.create(subscription);
    const savedSubscription = await Subscription.findById(newSubscription._id).lean().exec();
    return savedSubscription || newSubscription.toObject();
  }

  async findByUserId(userId: string): Promise<ISubscription | null> {
    if (!Types.ObjectId.isValid(userId)) {
      return null;
    }
    const subscription = await Subscription.findOne({ userId: new Types.ObjectId(userId) }).lean().exec();
    return subscription;
  }

  async findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<ISubscription | null> {
    const subscription = await Subscription.findOne({ stripeSubscriptionId }).lean().exec();
    return subscription;
  }

  async update(subscriptionId: string, update: Partial<ISubscription>): Promise<ISubscription | null> {
    if (!Types.ObjectId.isValid(subscriptionId)) {
      return null;
    }
    const updatedSubscription = await Subscription.findByIdAndUpdate(
      new Types.ObjectId(subscriptionId),
      update,
      { new: true }
    ).lean().exec();
    return updatedSubscription;
  }

  async findAll(): Promise<ISubscription[]> {
    const subscriptions = await Subscription.find().lean().exec();
    return subscriptions;
  }
}