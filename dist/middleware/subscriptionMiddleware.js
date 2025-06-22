"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkActiveSubscription = void 0;
/**
 * @name checkActiveSubscription
 * @description Middleware to verify if the authenticated user has an active subscription.
 * It checks the subscription status and expiry date.
 * This should run after the clerkAuth middleware.
 */
const checkActiveSubscription = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    // The user object is attached by the preceding clerkAuth middleware
    const user = req.user;
    if (!user) {
        // This is a safeguard, though clerkAuth should have already handled unauthenticated users.
        return res
            .status(401)
            .json({ message: "Authentication required. Please log in." });
    }
    const { status, endDate } = user.subscription;
    // Check if the subscription has expired
    if (status === "active" && endDate && endDate < new Date()) {
        // The subscription has expired. Update the status in the database.
        user.subscription.status = "inactive";
        yield user.save();
        return res.status(403).json({
            message: "Your subscription has expired. Please renew to continue accessing premium features.",
        });
    }
    // Check if the subscription is not active
    if (status !== "active") {
        return res.status(403).json({
            message: "An active subscription is required for this action. Please subscribe to a plan.",
        });
    }
    // If the subscription is active and not expired, proceed to the next handler
    next();
});
exports.checkActiveSubscription = checkActiveSubscription;
