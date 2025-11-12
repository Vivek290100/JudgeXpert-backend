// C:\Users\vivek_laxvnt1\Desktop\JudgeXpert\Backend\src\utils\stripe.ts
import Stripe from "stripe";
import { CONFIG } from "../config/config";

const stripe = new Stripe(CONFIG.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});

export class StripeUtils {
  static async createCustomer(email: string, name: string, metadata: { userId: string }): Promise<Stripe.Customer> {
    return await stripe.customers.create({
      email,
      name,
      metadata,
    });
  }

  static async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
    metadata: { userId: string; planId: string }
  ): Promise<Stripe.Checkout.Session> {
    return await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl, 
      cancel_url: cancelUrl,
      metadata,
      subscription_data: {
        metadata: {
          userId: metadata.userId,
          planId: metadata.planId,
        },
      },
    });
  }

  static constructWebhookEvent(payload: Buffer, signature: string): Stripe.Event {
    return stripe.webhooks.constructEvent(payload, signature, CONFIG.STRIPE_WEBHOOK_SECRET);
  }
}