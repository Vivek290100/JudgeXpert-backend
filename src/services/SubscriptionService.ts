import { Types } from "mongoose";
import { ISubscriptionRepository } from "../interfaces/repositoryInterfaces/ISubscriptionRepository";
import { IUserRepository } from "../interfaces/repositoryInterfaces/IUserRepository";
import { ISubscription } from "../types/ISubscription";
import { ISubscriptionService } from "../interfaces/serviceInterfaces/ISubscriptionService";
import { StripeUtils } from "../utils/stripe";
import { CONFIG } from "../config/config";
import Stripe from "stripe";
import { CustomStripeSubscription } from "../types/IStripe";

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

    const existingSubscription = await this.subscriptionRepository.findByUserId(userId);
    if (
      existingSubscription &&
      existingSubscription.status === "active" &&
      existingSubscription.currentPeriodEnd > new Date()
    ) {
      throw new Error("You already have an active subscription. Please wait until it expires or cancel it.");
    }

    const priceId = planId === "monthly" ? CONFIG.STRIPE_MONTHLY_PRICE_ID : CONFIG.STRIPE_YEARLY_PRICE_ID;
    // const price = planId === "monthly" ? 299 : 2499; // Price in rupees

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
      `${CONFIG.FRONTEND_URL}/user/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      `${CONFIG.FRONTEND_URL}/user/subscription?canceled=true`,
      { userId, planId }
    );

    return { checkoutUrl: session.url! };
  }

  async handleWebhookEvent(payload: Buffer, signature: string): Promise<void> {
    const event = StripeUtils.constructWebhookEvent(payload, signature);

    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        const subscription = event.data.object as CustomStripeSubscription;
        await this.handleSubscriptionEvent(event.type, subscription);
        break;
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        await this.handleCheckoutSessionCompleted(session);
        break;
      case "invoice.paid":
        const invoice = event.data.object as Stripe.Invoice;
        await this.handleInvoicePaid(invoice);
        break;
      case "invoice.payment_succeeded":
        const paymentSuccess = event.data.object as Stripe.Invoice;
        await this.handleInvoicePaymentSucceeded(paymentSuccess);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    const userId = session.metadata?.userId;
    const planId = session.metadata?.planId;
    const stripeSubscriptionId = session.subscription as string;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid or missing user ID in session metadata");
    }
    if (!planId) {
      throw new Error("Invalid or missing plan ID in session metadata");
    }
    if (!stripeSubscriptionId) {
      throw new Error("No subscription ID in checkout session");
    }

    const subscriptionData: Partial<ISubscription> = {
      userId: new Types.ObjectId(userId),
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId,
      planId,
      price: planId === "monthly" ? 299 : 2499, // Price in rupees
      status: "active",
      currentPeriodEnd: new Date((session.expires_at || Date.now() / 1000 + 30 * 24 * 60 * 60) * 1000),
    };

    const existingSubscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);
    if (!existingSubscription) {
      await this.subscriptionRepository.create(subscriptionData);
    }

    await this.updateUserPremiumStatus(userId);
  }

  private async handleInvoicePaid(invoice: Stripe.Invoice): Promise<void> {
    const stripeSubscriptionId = (invoice as any).subscription as string | null;
    if (!stripeSubscriptionId) {
      console.log("No subscription ID found in invoice, skipping invoice.paid handling");
      return;
    }

    const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);
    if (!subscription) {
      console.log(`No subscription found for subscription ID: ${stripeSubscriptionId}`);
      return;
    }

    const periodEnd = invoice.lines.data[0]?.period?.end
      ? new Date(invoice.lines.data[0].period.end * 1000)
      : subscription.currentPeriodEnd;

    await this.subscriptionRepository.update(subscription._id!.toString(), {
      status: "active",
      currentPeriodEnd: periodEnd,
    });

    await this.updateUserPremiumStatus(subscription.userId.toString());
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const stripeSubscriptionId = (invoice as any).subscription as string | null;
    if (!stripeSubscriptionId) {
      console.log("No subscription ID found in invoice, skipping invoice.payment_succeeded handling");
      return;
    }

    const subscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);
    if (!subscription) {
      console.log(`No subscription found for subscription ID: ${stripeSubscriptionId}`);
      return;
    }

    await this.subscriptionRepository.update(subscription._id!.toString(), {
      status: "active",
    });

    await this.updateUserPremiumStatus(subscription.userId.toString());
  }

  private async handleSubscriptionEvent(eventType: string, subscription: CustomStripeSubscription): Promise<void> {
    // const stripeSubscriptionId = subscription.id;
    const userId = subscription.metadata?.userId;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid or missing user ID in subscription metadata");
    }

    if (eventType === "customer.subscription.deleted") {
      await this.handleSubscriptionDeleted(subscription);
    } else {
      await this.handleSubscriptionUpdate(subscription);
    }
  }

  private async handleSubscriptionUpdate(subscription: CustomStripeSubscription): Promise<void> {
    const stripeSubscriptionId = subscription.id;
    const userId = subscription.metadata?.userId;

    const currentPeriodEnd = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const planId =
      subscription.metadata?.planId ||
      (subscription.items.data[0]?.price.id === CONFIG.STRIPE_MONTHLY_PRICE_ID ? "monthly" : "yearly");
    const price = planId === "monthly" ? 299 : 2499; // Price in rupees

    const subscriptionData: Partial<ISubscription> = {
      userId: new Types.ObjectId(userId!),
      stripeCustomerId: subscription.customer as string,
      stripeSubscriptionId,
      planId,
      price,
      status: subscription.status as ISubscription["status"],
      currentPeriodEnd,
    };

    const existingSubscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);

    if (existingSubscription) {
      await this.subscriptionRepository.update(existingSubscription._id!.toString(), subscriptionData);
    } else {
      await this.subscriptionRepository.create(subscriptionData);
    }

    await this.updateUserPremiumStatus(userId!);
  }

  private async handleSubscriptionDeleted(subscription: CustomStripeSubscription): Promise<void> {
    const stripeSubscriptionId = subscription.id;
    const userId = subscription.metadata?.userId;

    const existingSubscription = await this.subscriptionRepository.findByStripeSubscriptionId(stripeSubscriptionId);

    if (existingSubscription) {
      await this.subscriptionRepository.update(existingSubscription._id!.toString(), {
        status: "canceled",
        currentPeriodEnd: new Date(),
      });
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

    await this.userRepository.update(userId, { isPremium });
  }

  async checkAndUpdateExpiredSubscription(userId: string): Promise<ISubscription | null> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }

    const subscription = await this.subscriptionRepository.findByUserId(userId);
    if (!subscription) {
      return null;
    }

    const now = new Date();
    if (subscription.status === "active" && subscription.currentPeriodEnd <= now) {
      await this.subscriptionRepository.update(subscription._id!.toString(), {
        status: "canceled",
        currentPeriodEnd: now,
      });
      await this.updateUserPremiumStatus(userId);
    }

    return subscription;
  }

  async checkAndUpdateExpiredSubscriptions(): Promise<void> {
    const subscriptions = await this.subscriptionRepository.findAll();
    const now = new Date();

    for (const subscription of subscriptions) {
      if (subscription.status === "active" && subscription.currentPeriodEnd <= now) {
        await this.subscriptionRepository.update(subscription._id!.toString(), {
          status: "canceled",
          currentPeriodEnd: now,
        });
        await this.updateUserPremiumStatus(subscription.userId.toString());
      }
    }
  }

  async findByUserId(userId: string): Promise<ISubscription | null> {
    if (!Types.ObjectId.isValid(userId)) {
      throw new Error("Invalid user ID format");
    }
    return await this.subscriptionRepository.findByUserId(userId);
  }
}