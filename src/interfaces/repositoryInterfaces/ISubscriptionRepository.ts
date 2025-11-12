// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\interfaces\repositoryInterfaces\ISubscriptionRepository.ts
import { ISubscription } from "../../types/ISubscription";

export interface ISubscriptionRepository {
  create(subscription: Partial<ISubscription>): Promise<ISubscription>;
  findByUserId(userId: string): Promise<ISubscription | null>;
  findByStripeSubscriptionId(stripeSubscriptionId: string): Promise<ISubscription | null>;
  update(subscriptionId: string, update: Partial<ISubscription>): Promise<ISubscription | null>;
  findAll(): Promise<ISubscription[]>;
  aggregate(pipeline: any[]): Promise<any[]>;

}