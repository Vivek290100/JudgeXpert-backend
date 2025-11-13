import { Request, Response } from "express";
import { Types } from "mongoose";
import { ISubscriptionService } from "../interfaces/serviceInterfaces/ISubscriptionService";
import { sendResponse } from "../utils/responseUtils";
import { AuthRequest } from "../middlewares/authMiddleware";
import { StatusCode } from "../utils/statusCode";
import { CONFIG } from "../config/config";
import Stripe from "stripe";

const stripe = new Stripe(CONFIG.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});

export default class SubscriptionController {
  private subscriptionService: ISubscriptionService;

  constructor(subscriptionService: ISubscriptionService) {
    this.subscriptionService = subscriptionService;
  }

  async createCheckoutSession(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.userId;
    const { planId } = req.body;

    if (!userId || !planId) {
      sendResponse(res, {
        success: false,
        status: StatusCode.BAD_REQUEST,
        message: "User ID and plan ID are required",
      });
      return;
    }

    if (!Types.ObjectId.isValid(userId)) {
      sendResponse(res, {
        success: false,
        status: StatusCode.BAD_REQUEST,
        message: "Invalid user ID format",
      });
      return;
    }

    try {
      const { checkoutUrl } = await this.subscriptionService.createCheckoutSession(userId, planId);
      console.log("checkoutUrl",checkoutUrl);
      
      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: "Checkout session created",
        data: { checkoutUrl },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: StatusCode.INTERNAL_SERVER_ERROR,
        message: error.message || "Failed to create checkout session",
      });
    }
  }

  async handleWebhook(req: Request, res: Response): Promise<void> {
    const signature = req.headers["stripe-signature"] as string;
    console.log("signature",signature);
    
    const payload = req.body;

    try {
      if (!Buffer.isBuffer(payload)) {
        throw new Error("Webhook payload is not a Buffer");
      }
      await this.subscriptionService.handleWebhookEvent(payload, signature);
      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: "Webhook processed successfully",
      });
    } catch (error: any) {
      console.error("Webhook error:", error);
      sendResponse(res, {
        success: false,
        status: StatusCode.BAD_REQUEST,
        message: error.message || "Webhook processing failed",
      });
    }
  }

  async getCurrentSubscription(req: AuthRequest, res: Response): Promise<void> {
    const userId = req.user?.userId;

    if (!userId || !Types.ObjectId.isValid(userId)) {
      sendResponse(res, {
        success: false,
        status: StatusCode.BAD_REQUEST,
        message: "Invalid user ID",
      });
      return;
    }

    try {
      const subscription = await this.subscriptionService.findByUserId(userId);
      console.log("subscription111",subscription);
      

      if (!subscription) {
        sendResponse(res, {
          success: true,
          status: StatusCode.SUCCESS,
          message: "No active subscription found",
          data: null,
        });
        return;
      }

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: "Subscription retrieved successfully",
        data: {
          planId: subscription.planId,
          price: subscription.price,
          status: subscription.status,
          currentPeriodEnd: subscription.currentPeriodEnd,
        },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: StatusCode.INTERNAL_SERVER_ERROR,
        message: error.message || "Failed to retrieve subscription",
      });
    }
  }

  async getCheckoutSession(req: AuthRequest, res: Response): Promise<void> {
    const sessionId = req.query.session_id as string;
    console.log("sessionId",sessionId);
    
    const userId = req.user?.userId;

    if (!sessionId || !userId || !Types.ObjectId.isValid(userId)) {
      sendResponse(res, {
        success: false,
        status: StatusCode.BAD_REQUEST,
        message: "Invalid session ID or user ID",
      });
      return;
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
          console.log("session",session);


      const sessionUserId = session.metadata?.userId;
      if (!sessionUserId || sessionUserId !== userId) {
        sendResponse(res, {
          success: false,
          status: StatusCode.BAD_REQUEST,
          message: "Session does not belong to this user",
        });
        return;
      }

      if (session.payment_status !== "paid") {
        sendResponse(res, {
          success: false,
          status: StatusCode.BAD_REQUEST,
          message: "Payment not completed",
        });
        return;
      }

      if (!session.subscription) {
        sendResponse(res, {
          success: false,
          status: StatusCode.BAD_REQUEST,
          message: "Subscription not created",
        });
        return;
      }

      sendResponse(res, {
        success: true,
        status: StatusCode.SUCCESS,
        message: "Checkout session verified",
        data: {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          subscriptionId: session.subscription,
        },
      });
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: StatusCode.INTERNAL_SERVER_ERROR,
        message: error.message || "Failed to retrieve checkout session",
      });
    }
  }

  async handleSuccess(req: AuthRequest, res: Response): Promise<void> {
    const sessionId = req.query.session_id as string;
    console.log("sessionIdsessionId",sessionId);
    
    const userId = req.user?.userId;

    if (!sessionId || !userId || !Types.ObjectId.isValid(userId)) {
      sendResponse(res, {
        success: false,
        status: StatusCode.BAD_REQUEST,
        message: "Invalid session ID or user ID",
      });
      return;
    }

    try {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      console.log("sessionsession",session);
      
      if (session.metadata?.userId !== userId) {
        sendResponse(res, {
          success: false,
          status: StatusCode.BAD_REQUEST,
          message: "Session does not belong to this user",
        });
        return;
      }

      if (session.payment_status !== "paid" || !session.subscription) {
        sendResponse(res, {
          success: false,
          status: StatusCode.BAD_REQUEST,
          message: "Payment not completed or subscription not created",
        });
        return;
      }

      const subscription = await this.subscriptionService.findByUserId(userId);
      console.log("subscription0",subscription);
      
      if (!subscription || subscription.status !== "active") {
        sendResponse(res, {
          success: false,
          status: StatusCode.BAD_REQUEST,
          message: "No active subscription found",
        });
        return;
      }

      res.redirect(`${CONFIG.FRONTEND_URL}/user/subscription/success?session_id=${sessionId}`);
    } catch (error: any) {
      sendResponse(res, {
        success: false,
        status: StatusCode.INTERNAL_SERVER_ERROR,
        message: error.message || "Failed to verify subscription",
      });
    }
  }
}