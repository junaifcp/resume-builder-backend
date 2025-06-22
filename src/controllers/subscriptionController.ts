// ---- FILE: src/controllers/subscriptionController.ts ----

import { Request, Response } from "express";
import { subscriptionService } from "../services/subscription.service";
import { IUser } from "../models/User";
import Plan from "../models/Plan";
import axios from "axios";

const CF_BASE = process.env.CASHFREE_ENVIRONMENT_URL!; // e.g. https://sandbox.cashfree.com/pg
const CF_KEY = process.env.CASHFREE_API_KEY!;
const CF_SECRET = process.env.CASHFREE_SECRET_KEY!;
const CF_API_VERSION = "2023-08-01";

export const getPlans = async (req: Request, res: Response) => {
  const plans = await subscriptionService.getAllPlans();
  res.status(200).json(plans);
};

export const createSubscription = async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;
  const { planId } = req.body;

  try {
    const details = await subscriptionService.createSubscription(user, planId);
    res.status(201).json({ success: true, ...details });
  } catch (err: any) {
    console.error("Subscription creation error:", err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message,
      ...(err.details && { error: err.details }),
    });
  }
};

// export const verifyPayment = async (req: Request, res: Response) => {
//   const user = (req as any).user as IUser;
//   const verificationResult = await subscriptionService.verifyCashfreeWebhook(
//     user,
//     req.body
//   );
//   res.status(200).json(verificationResult);
// };
/**
 * Controller to check the current user's subscription status.
 */
export const checkUserSubscriptionStatus = async (
  req: Request,
  res: Response
) => {
  try {
    // Assumes an authentication middleware has attached the user object to the request
    const user = (req as any).user as IUser;

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Authentication required." });
    }

    const statusDetails = await subscriptionService.getSubscriptionStatus(
      user._id.toString()
    );

    res.status(200).json({ success: true, ...statusDetails });
  } catch (error: any) {
    console.error("Error checking subscription status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check subscription status.",
    });
  }
};
export const createPlan = async (req: Request, res: Response) => {
  const { name, price, durationMonths } = req.body;

  try {
    // 1. Create plan on Cashfree
    const cfResp = await axios.post(
      `${CF_BASE}/plans`,
      {
        plan_id: `plan_${Date.now()}`, // your unique internal ID
        plan_name: name, // friendly name
        plan_type: "PERIODIC", // or FLAT as per docs
        plan_currency: "INR",
        plan_recurring_amount: price, // in paise
        plan_max_amount: price, // usually same as recurring
        plan_max_cycles: durationMonths, // number of billing cycles
        plan_intervals: durationMonths, // same as max_cycles
        plan_interval_type: "MONTH", // MONTH / WEEK / YEAR
        plan_note: `${durationMonths}-month plan`,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "x-client-id": CF_KEY,
          "x-client-secret": CF_SECRET,
          "x-api-version": CF_API_VERSION,
        },
      }
    );

    const cashfreePlanId = cfResp.data?.plan_id;
    if (!cashfreePlanId) {
      throw new Error("Cashfree did not return a plan_id");
    }

    // 2. Persist locally
    const newPlan = await Plan.create({
      name,
      cashfreePlanId,
      price,
      durationMonths,
    });

    res.status(201).json({
      success: true,
      plan: newPlan,
    });
  } catch (err: any) {
    console.error(
      "❌ Cashfree plan creation failed:",
      err.response?.data || err.message
    );
    res.status(500).json({
      success: false,
      message: "Failed to create plan",
      error: err.response?.data || err.message,
    });
  }
};

/**
 * Handles incoming webhooks from Cashfree.
 */

export const handleCashfreeWebhook = async (req: Request, res: Response) => {
  console.log("\n---  recebido webhook da Cashfree ---");
  try {
    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      throw new Error("Corpo bruto ausente.");
    }

    const verifiedEvent = subscriptionService.verifyCashfreeWebhook(
      rawBody,
      req.headers
    );

    // --- THIS IS THE MOST IMPORTANT LINE ---
    // --- ENSURE IT IS EXACTLY LIKE THIS AND NOT COMMENTED OUT ---
    console.log(
      "--- INÍCIO DO PAYLOAD DO WEBHOOK ---",
      JSON.stringify(verifiedEvent, null, 2),
      "--- FIM DO PAYLOAD DO WEBHOOK ---"
    );
    // ------------------------------------

    await subscriptionService.handleWebhookEvent(verifiedEvent);

    res.status(200).json({ status: "success", message: "Webhook processed." });
  } catch (error: any) {
    console.error(
      "💥 FALHA no processamento do webhook da Cashfree:",
      error.message
    );
    res.status(400).json({ status: "error", message: error.message });
  }
};
// export const handleCashfreeWebhook = async (req: Request, res: Response) => {
//   try {
//     // IMPORTANT: You need access to the raw request body for signature verification.
//     // This assumes you have the necessary middleware in your main server file:
//     // app.use(express.json({ verify: (req, res, buf) => { (req as any).rawBody = buf.toString(); } }));
//     const rawBody = (req as any).rawBody;
//     if (!rawBody) {
//       throw new Error(
//         "Missing raw request body. Please ensure the verification middleware is set up correctly."
//       );
//     }

//     // Step 1: Verify the webhook signature to ensure it's authentic.
//     const verifiedEvent = subscriptionService.verifyCashfreeWebhook(
//       rawBody,
//       req.headers
//     );

//     // Step 2: If verification is successful, process the event to update your database.
//     await subscriptionService.handleWebhookEvent(verifiedEvent);

//     // Step 3: Respond to Cashfree with a 200 OK status to acknowledge receipt.
//     res.status(200).json({ status: "success", message: "Webhook processed." });
//   } catch (error: any) {
//     console.error("Error processing Cashfree webhook:", error.message);
//     // Respond with an error status so Cashfree knows something went wrong.
//     res.status(400).json({ status: "error", message: error.message });
//   }
// };
