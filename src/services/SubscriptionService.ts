import { Types } from "mongoose";
import { ISubscriptionRepository } from "../interfaces/repositoryInterfaces/ISubscriptionRepository";
import { IUserRepository } from "../interfaces/repositoryInterfaces/IUserRepository";
import { ISubscription } from "../types/ISubscription";
import { ISubscriptionService } from "../interfaces/serviceInterfaces/ISubscriptionService";
import { StripeUtils } from "../utils/stripe";
import { CONFIG } from "../config/config";
import Stripe from "stripe";

export default class SubscriptionService implements ISubscriptionService {
  constructor(
    private subscriptionRepository: ISubscriptionRepository,
    private userRepository: IUserRepository
  ) {}

  async createCheckoutSession(userId: string, planId: string): Promise<{ checkoutUrl: string }> {
    if (!["monthly", "yearly"].includes(planId)) {
      throw new Error("Invalid plan ID");
    }

    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }

    const user = await this.userRepository.findById(userId);
    if (!user) throw new Error("User not found");

    const priceId = planId === "monthly" ? CONFIG.STRIPE_MONTHLY_PRICE_ID : CONFIG.STRIPE_YEARLY_PRICE_ID;

    console.log(`Creating checkout session for plan: ${planId}, priceId: ${priceId}`); // Debug

    if (!priceId) {
      throw new Error(`Price ID for ${planId} plan is not configured`);
    }

    let stripeCustomerId = user.stripeCustomerId;

    if (!stripeCustomerId) {
      const customer = await StripeUtils.createCustomer(user.email, user?.userName || "", { userId });
      stripeCustomerId = customer.id;
      await this.userRepository.update(userId, { stripeCustomerId });
    }

    const session = await StripeUtils.createCheckoutSession(
      stripeCustomerId,
      priceId,
      `${CONFIG.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      `${CONFIG.FRONTEND_URL}/subscription/canceled`,
      { userId, planId }
    );

    return { checkoutUrl: session.url! };
  }

  async handleWebhookEvent(payload: Buffer, signature: string): Promise<void> {
    const event = StripeUtils.constructWebhookEvent(payload, signature);

    console.log(`Processing webhook event: ${event.type}, ID: ${event.id}`);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        const subscription = event.data.object as Stripe.Subscription;
        console.log(`Subscription metadata: ${JSON.stringify(subscription.metadata || {})}`);
        await this.handleSubscriptionEvent(event.type, subscription);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleSubscriptionEvent(eventType: string, subscription: Stripe.Subscription): Promise<void> {
    const stripeSubscriptionId = subscription.id;
    const userId = subscription.metadata?.userId;

    console.log(`${eventType} - stripeSubscriptionId: ${stripeSubscriptionId}, userId: ${userId}`);
    console.log(`Subscription metadata: ${JSON.stringify(subscription.metadata || {})}`);

    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid or missing user ID in subscription metadata");
    }

    if (eventType === "customer.subscription.deleted") {
      await this.handleSubscriptionDeleted(subscription);
    } else {
      await this.handleSubscriptionUpdate(subscription);
    }
  }

  private async handleSubscriptionUpdate(subscription: Stripe.Subscription): Promise<void> {
    const stripeSubscriptionId = subscription.id;
    const userId = subscription.metadata?.userId;

    // Safely access current_period_end
    const currentPeriodEnd = (subscription as any).current_period_end
      ? new Date((subscription as any).current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Fallback: 30 days from now

    const subscriptionData: Partial<ISubscription> = {
      userId: new Types.ObjectId(userId!),
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId,
      planId:
        subscription.metadata?.planId ||
        (subscription.items.data[0].price.id === CONFIG.STRIPE_MONTHLY_PRICE_ID ? "monthly" : "yearly"),
      status: subscription.status as ISubscription["status"],
      currentPeriodEnd,
    };

    console.log("Subscription data to save:", subscriptionData);

    const existingSubscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);

    if (existingSubscription) {
      await this.subscriptionRepository.update(existingSubscription._id!.toString(), subscriptionData);
      console.log(`Updated subscription: ${existingSubscription._id}`);
    } else {
      await this.subscriptionRepository.create(subscriptionData);
      console.log(`Created subscription: ${stripeSubscriptionId}`);
    }

    await this.updateUserPremiumStatus(userId!);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    const stripeSubscriptionId = subscription.id;
    const userId = subscription.metadata?.userId;

    const existingSubscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);

    if (existingSubscription) {
      await this.subscriptionRepository.update(existingSubscription._id!.toString(), {
        status: "canceled",
        currentPeriodEnd: new Date(),
      });
      console.log(`Canceled subscription: ${existingSubscription._id}`);
      await this.updateUserPremiumStatus(userId!);
    }
  }

  async updateUserPremiumStatus(userId: string): Promise<void> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }

    const subscription = await this.subscriptionRepository.findByUserId(userId);
    const now = new Date();
    const isPremium = subscription && subscription.status === "active" && subscription.currentPeriodEnd > now;

    console.log(`Updating user ${userId} isPremium: ${isPremium}`);

    await this.userRepository.update(userId, { isPremium });
  }

  async findByUserId(userId: string): Promise<ISubscription | null> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }
    return await this.subscriptionRepository.findByUserId(userId);
  }
}