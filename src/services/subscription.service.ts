import crypto from "crypto";
import Plan, { IPlan } from "../models/Plan";
import User, { IUser } from "../models/User"; // Make sure to import your User model
import axios from "axios";
import { Types } from "mongoose";

// --- CONFIGURATION ---
const CF_BASE = process.env.CASHFREE_ENVIRONMENT_URL!;
const CF_KEY = process.env.CASHFREE_API_KEY!;
const CF_SECRET = process.env.CASHFREE_SECRET_KEY!;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"; // Important for return URLs

// --- TYPES ---
// The status types expected by our IUser model
type UserSubscriptionStatus =
  | "inactive"
  | "active"
  | "on_hold"
  | "cancelled"
  | "completed"
  | "initialized";

// The shape of a webhook event from Cashfree
interface CashfreeWebhookEvent {
  type: string;
  data: {
    subscription: {
      subscription_id: string;
      customer_details: {
        customer_id: string;
      };
      status:
        | "INITIALIZED"
        | "ACTIVE"
        | "ON_HOLD"
        | "CANCELLED"
        | "COMPLETED"
        | "BANK_APPROVAL_PENDING";
      // ... other potential properties from Cashfree
    };
  };
  event_time: string;
}

/**
 * Maps an uppercase status from Cashfree to the lowercase status used in our database model.
 * @param cashfreeStatus - The status string from the Cashfree webhook (e.g., 'ACTIVE').
 * @returns The corresponding lowercase status for our IUser model.
 */
const mapCashfreeStatus = (cashfreeStatus: string): UserSubscriptionStatus => {
  switch (cashfreeStatus) {
    case "ACTIVE":
      return "active";
    case "INITIALIZED":
      return "initialized";
    case "ON_HOLD":
    case "BANK_APPROVAL_PENDING": // We treat pending approval as 'on_hold'
      return "on_hold";
    case "CANCELLED":
      return "cancelled";
    case "COMPLETED":
      return "completed";
    default:
      // Fallback for any unexpected or unhandled statuses
      console.warn(`Unhandled Cashfree status encountered: ${cashfreeStatus}`);
      return "inactive";
  }
};

/**
 * Retrieves all available subscription plans from the database, sorted by price.
 */
const getAllPlans = async (): Promise<IPlan[]> => {
  return Plan.find({}).sort({ price: 1 });
};

/**
 * Creates a subscription in Cashfree and saves its initial state to our database.
 * @param user - The user for whom to create the subscription.
 * @param dbPlanId - The ObjectId of the plan from our database.
 * @returns Details needed by the frontend to start the checkout process.
 */
// In src/services/subscription.service.ts

const createSubscription = async (
  user: IUser,
  dbPlanId: string
): Promise<{
  paymentSessionId: string;
  orderId: string;
  amount: number;
  planName: string;
}> => {
  const plan = (await Plan.findById(dbPlanId).exec()) as IPlan & {
    _id: Types.ObjectId;
  };
  if (!plan || !plan.cashfreePlanId) {
    throw new Error(
      "Subscription plan not found or is missing a Cashfree Plan ID."
    );
  }

  // --- THIS IS THE CORRECTED PAYLOAD STRUCTURE ---
  const payload = {
    customer_details: {
      customer_id: user._id.toString(),
      customer_email: user.email,
      customer_phone: (user as any).phone || "9999999999",
    },
    order_meta: {
      // include both placeholders here
      return_url: `${FRONTEND_URL}/payment-success?order_id={order_id}&cf_payment_id={payment_id}`,
    },
    order_id: `order_${user._id.toString()}_${Date.now()}`,
    order_amount: plan.price / 100, // The /orders API expects the amount in rupees.
    order_currency: "INR",
    order_note: `Subscription for ${plan.name}`,

    // --- REMOVED order_splits AND ADDED THIS 'subscription' OBJECT ---
    subscription: {
      plan_details: {
        plan_id: plan.cashfreePlanId,
      },
      subscription_note: `User ${user.email} subscribing to ${plan.name}`,
    },
  };

  let cfResp;
  try {
    // We are still correctly hitting the /orders endpoint
    cfResp = await axios.post(`${CF_BASE}/orders`, payload, {
      headers: {
        "Content-Type": "application/json",
        "x-client-id": CF_KEY,
        "x-client-secret": CF_SECRET,
        "x-api-version": "2023-08-01",
      },
    });
  } catch (err: any) {
    console.error("Cashfree order create failed:", err.response?.data);
    const details = err.response?.data;
    throw new Error(
      `Failed to create order: ${details?.message || "Unknown error"}`
    );
  }

  const paymentSessionId = cfResp.data?.payment_session_id as
    | string
    | undefined;
  const orderId = cfResp.data?.order_id as string | undefined;

  if (!paymentSessionId || !orderId) {
    console.error(
      "Cashfree response was missing 'payment_session_id' or 'order_id':",
      cfResp.data
    );
    throw new Error("Cashfree did not return a valid payment session.");
  }

  // The rest of the function remains the same
  user.subscription.status = "initialized";
  // user.subscription.orderId = orderId; // Optional
  await user.save();

  return {
    paymentSessionId,
    orderId,
    amount: plan.price,
    planName: plan.name,
  };
};

/**
 * Verifies the signature of an incoming webhook from Cashfree to ensure it's authentic.
 * @param rawBody - The raw, unparsed request body string.
 * @param headers - The request headers object containing the signature.
 * @returns The parsed and verified webhook event data.
 */

const verifyCashfreeWebhook = (
  rawBody: string,
  headers: Record<string, any>
): CashfreeWebhookEvent => {
  console.log("   [Service: verifyCashfreeWebhook] Iniciando verificação...");
  const signature = headers["x-webhook-signature"];
  const timestamp = headers["x-webhook-timestamp"];
  const secretKey = process.env.CASHFREE_SECRET_KEY!;

  if (!signature || !timestamp) {
    // Essa verificação é redundante, pois já está no controller, mas é uma boa proteção
    throw new Error(
      "Webhook Error: Cabeçalhos de assinatura ou timestamp ausentes no serviço."
    );
  }

  const stringToSign = timestamp + rawBody;
  const expectedSignature = crypto
    .createHmac("sha256", secretKey)
    .update(stringToSign)
    .digest("base64");

  console.log(`     - Assinatura Recebida: ${signature}`);
  console.log(`     - Assinatura Esperada: ${expectedSignature}`);

  if (signature !== expectedSignature) {
    console.error("     - ERRO: A assinatura não corresponde!");
    throw new Error("Webhook Error: Assinatura inválida.");
  }

  console.log(
    "   [Service: verifyCashfreeWebhook] A verificação foi bem-sucedida."
  );
  return JSON.parse(rawBody);
};

/**
 * Processes a verified webhook event to update subscription status in the database.
 * This version is now perfectly aligned with the real Cashfree payload structure.
 * @param event - The verified webhook event object from Cashfree.
 */
const handleWebhookEvent = async (event: any): Promise<void> => {
  console.log(
    `   [Service: handleWebhookEvent] Processing event of type: ${event.type}`
  );

  let user: IUser | null = null;

  // --- FINAL CORRECTED LOGIC TO FIND THE USER ---
  if (event.type === "PAYMENT_SUCCESS_WEBHOOK" && event.data.customer_details) {
    // For the initial payment success, we find the user via the top-level customer_details.
    const customerId = event.data.customer_details.customer_id;

    if (!customerId) {
      console.error(
        `Webhook Error: 'customer_id' not found in PAYMENT_SUCCESS_WEBHOOK payload.`
      );
      return;
    }
    console.log(
      `     - Event is order-related. Finding user by customer_id: ${customerId}`
    );
    user = await User.findById(customerId);
  } else if (event.data.subscription?.subscription_id) {
    // For subsequent events (renewals, cancellations), we use the subscription_id.
    const subscriptionId = event.data.subscription.subscription_id;
    console.log(
      `     - Event is subscription-related. Finding user by subscription_id: ${subscriptionId}`
    );
    user = await User.findOne({
      "subscription.subscriptionId": subscriptionId,
    });
  } else {
    console.warn(
      `     - WARNING: Could not determine how to find user from this event type. Payload lacks identifiable keys.`
    );
    return;
  }
  // --- END OF CORRECTED LOGIC ---

  if (!user) {
    console.warn(`     - WARNING: User not found for this event. Ignoring.`);
    return;
  }
  console.log(`     - User found: ${user.email}`);

  const plan = await Plan.findById(user.subscription.planId);
  if (!plan) {
    console.error(
      `Plan not found for user: ${user._id} during webhook processing.`
    );
    return;
  }

  // Activate subscription and save the permanent subscription ID when it arrives
  switch (event.type) {
    case "PAYMENT_SUCCESS_WEBHOOK":
      console.log(
        `     - Activating subscription for user ${user.email} due to successful order payment.`
      );
      user.subscription.status = "active";

      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + plan.durationMonths);
      user.subscription.endDate = endDate;
      console.log(
        `     - Subscription end date set to: ${endDate.toISOString()}`
      );

      // IMPORTANT: The permanent subscription_id is not in this event.
      // We will get it from the SUBSCRIPTION_STATUS_UPDATE event that follows.
      break;

    case "SUBSCRIPTION_STATUS_UPDATE":
      const newStatus = mapCashfreeStatus(event.data.subscription.status);
      console.log(
        `     - Updating status for ${user.email} to '${newStatus}' via status update event.`
      );
      user.subscription.status = newStatus;

      // This is where we receive and save the permanent subscription ID
      if (event.data.subscription.subscription_id) {
        user.subscription.subscriptionId =
          event.data.subscription.subscription_id;
        console.log(
          `     - Saved/updated permanent subscription ID: ${user.subscription.subscriptionId}`
        );
      }
      break;

    // (Add other cases like SUBSCRIPTION_PAYMENT_FAILED as needed)

    default:
      console.log(
        `     - Received unhandled event type: ${event.type}. No action taken.`
      );
      return;
  }

  await user.save();
  console.log(
    `   [Service: handleWebhookEvent] User ${user.email} updated successfully. New status: ${user.subscription.status}`
  );
};

/**
 * Checks the subscription status for a given user.
 * @param userId The ID of the user to check.
 * @returns An object with the user's subscription status, plan name, and end date.
 */
const getSubscriptionStatus = async (
  userId: string
): Promise<{
  isActive: boolean;
  planName: string | null;
  endDate: Date | null;
}> => {
  const user = await User.findById(userId).populate("subscription.planId");

  if (!user || !user.subscription || !user.subscription.status) {
    return { isActive: false, planName: null, endDate: null };
  }

  const { status, endDate, planId } = user.subscription;

  // 👇 Safely cast populated planId to IPlan
  const plan = planId as unknown as IPlan;

  // Handle expired active subscription
  if (status === "active" && endDate && new Date() > endDate) {
    console.log(
      `Subscription for user ${user.email} has expired. Updating status to inactive.`
    );
    user.subscription.status = "inactive";
    await user.save();
    return { isActive: false, planName: null, endDate: null };
  }

  if (status === "active") {
    return {
      isActive: true,
      planName: plan?.name || "Active Plan",
      endDate: endDate || null,
    };
  }

  return { isActive: false, planName: null, endDate: null };
};

// --- EXPORT THE SERVICE ---
export const subscriptionService = {
  getAllPlans,
  createSubscription,
  verifyCashfreeWebhook,
  handleWebhookEvent,
  getSubscriptionStatus,
};
