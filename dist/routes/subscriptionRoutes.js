"use strict";
// ---- FILE: src/routes/subscriptionRoutes.ts ----
Object.defineProperty(exports, "__esModule", { value: true });
const subscriptionController_1 = require("../controllers/subscriptionController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const express_1 = require("express");
// Helper to wrap async middleware for Express
function asyncHandler(fn) {
    return function (req, res, next) {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
}
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const router = (0, express_1.Router)();
/**
router.use(asyncHandler(clerkAuth));
 * @desc    Get all available subscription plans.
 * @access  Public (Users can see plans before logging in)
 */
router.get("/plans", subscriptionController_1.getPlans);
// Apply authentication middleware for the routes below
// router.use(asyncHandler(clerkAuth));
/**
 * @route   POST /api/subscriptions/create
 * @desc    Create a Razorpay subscription instance for the logged-in user.
 * @access  Private
 */
router.post("/create", (0, validationMiddleware_1.validate)(validationSchemas_1.createSubscriptionSchema), authMiddleware_1.clerkAuth, subscriptionController_1.createSubscription);
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
router.post("/plans", (0, validationMiddleware_1.validate)(validationSchemas_1.createPlanSchema), asyncHandler(subscriptionController_1.createPlan));
router.get("/status", authMiddleware_1.clerkAuth, asyncHandler(subscriptionController_1.checkUserSubscriptionStatus));
router.post("/webhook/cashfree", subscriptionController_1.handleCashfreeWebhook);
exports.default = router;
