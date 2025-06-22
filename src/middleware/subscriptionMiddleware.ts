import { Request, Response, NextFunction } from "express";
import { IUser } from "../models/User";

/**
 * @name checkActiveSubscription
 * @description Middleware to verify if the authenticated user has an active subscription.
 * It checks the subscription status and expiry date.
 * This should run after the clerkAuth middleware.
 */
export const checkActiveSubscription = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // The user object is attached by the preceding clerkAuth middleware
  const user = (req as any).user as IUser;

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
    await user.save();
    return res.status(403).json({
      message:
        "Your subscription has expired. Please renew to continue accessing premium features.",
    });
  }

  // Check if the subscription is not active
  if (status !== "active") {
    return res.status(403).json({
      message:
        "An active subscription is required for this action. Please subscribe to a plan.",
    });
  }

  // If the subscription is active and not expired, proceed to the next handler
  next();
};
