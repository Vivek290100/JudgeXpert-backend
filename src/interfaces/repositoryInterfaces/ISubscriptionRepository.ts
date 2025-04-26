import { ISubscription } from "../../types/ISubscription";

export interface ISubscriptionRepository {
  create(subscription: Partial<ISubscription>): Promise<ISubscription>;
  findByUserId(userId: string): Promise<ISubscription | null>;
  findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<ISubscription | null>;
  update(subscriptionId: string, update: Partial<ISubscription>): Promise<ISubscription | null>;
  findAll(): Promise<ISubscription[]>;
}