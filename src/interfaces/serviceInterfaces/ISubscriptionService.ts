import { ISubscription } from "../../types/ISubscription";

// Backend\src\interfaces\serviceInterfaces\ISubscriptionService.ts
export interface ISubscriptionService {
    createCheckoutSession(userId: string, planId: string): Promise<{ checkoutUrl: string }>;
    handleWebhookEvent(payload: Buffer, signature: string): Promise<void>;
    updateUserPremiumStatus(userId: string): Promise<void>;
    findByUserId(userId: string): Promise<ISubscription | null>;
  }