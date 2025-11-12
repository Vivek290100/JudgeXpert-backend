// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\interfaces\serviceInterfaces\ISubscriptionService.ts
import { ISubscription } from "../../types/ISubscription";

export interface ISubscriptionService {
  createCheckoutSession(userId: string, planId: string): Promise<{ checkoutUrl: string }>;
  handleWebhookEvent(payload: Buffer, signature: string): Promise<void>;
  updateUserPremiumStatus(userId: string): Promise<void>;
  findByUserId(userId: string): Promise<ISubscription | null>;
  checkAndUpdateExpiredSubscription(userId: string): Promise<ISubscription | null>;
  checkAndUpdateExpiredSubscriptions(): Promise<void>;
}