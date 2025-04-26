import Stripe from "stripe";

export interface CustomStripeSubscription extends Stripe.Subscription {
  current_period_end: number;
  current_period_start: number;
  customer: string;
  status: Stripe.Subscription.Status;
  items: Stripe.ApiList<Stripe.SubscriptionItem>;
  metadata: {
    userId?: string;
    planId?: string;
  };
}