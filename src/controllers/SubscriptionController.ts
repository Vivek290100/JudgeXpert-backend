import { Request, Response } from "express";
import { Types } from "mongoose";
import { ISubscriptionService } from "../interfaces/serviceInterfaces/ISubscriptionService";
import { sendResponse } from "../utils/responseUtils";
import { AuthRequest } from "../middlewares/authMiddleware";
import { StatusCode } from "../utils/statusCode";

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
    const payload = req.body;
  
    console.log("Webhook payload type:", typeof payload, Buffer.isBuffer(payload));
    console.log("Webhook payload:", payload.toString());
  
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
      console.error("Webhook error:", error.message);
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
}