// ---- FILE: src/routes/subscriptionRoutes.ts ----

import {
  getPlans,
  createSubscription,
  // verifyPayment,
  createPlan,
  checkUserSubscriptionStatus,
  handleCashfreeWebhook,
} from "../controllers/subscriptionController";
import { clerkAuth } from "../middleware/authMiddleware";
import express, { Request, Response, Router } from "express";
// Helper to wrap async middleware for Express
function asyncHandler(fn: any) {
  return function (req: any, res: any, next: any) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
import { validate } from "../middleware/validationMiddleware";
import {
  createPlanSchema,
  createSubscriptionSchema,
  verifyPaymentSchema,
} from "../utils/validationSchemas";
import { subscriptionService } from "../services/subscription.service";

const router = Router();

/**
router.use(asyncHandler(clerkAuth));
 * @desc    Get all available subscription plans.
 * @access  Public (Users can see plans before logging in)
 */
router.get("/plans", getPlans);

// Apply authentication middleware for the routes below
// router.use(asyncHandler(clerkAuth));

/**
 * @route   POST /api/subscriptions/create
 * @desc    Create a Razorpay subscription instance for the logged-in user.
 * @access  Private
 */
router.post(
  "/create",
  validate(createSubscriptionSchema),
  clerkAuth,
  createSubscription
);

/**
 * @route   POST /api/subscriptions/verify
 * @desc    Verify the payment after Razorpay checkout to activate the subscription.
 * @access  Private
 */
// router.post("/verify", validate(verifyPaymentSchema), verifyPayment);

/**
 * @route   POST /api/subscriptions/plans
 * @desc    Create a new subscription plan.
 * @access  Private (Admin use only)
 */
router.post("/plans", validate(createPlanSchema), asyncHandler(createPlan));
router.get("/status", clerkAuth, asyncHandler(checkUserSubscriptionStatus));
router.post("/webhook/cashfree", handleCashfreeWebhook);
export default router;
