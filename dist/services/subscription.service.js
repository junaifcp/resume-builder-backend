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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriptionService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const Plan_1 = __importDefault(require("../models/Plan"));
const User_1 = __importDefault(require("../models/User")); // Make sure to import your User model
const axios_1 = __importDefault(require("axios"));
// --- CONFIGURATION ---
const CF_BASE = process.env.CASHFREE_ENVIRONMENT_URL;
const CF_KEY = process.env.CASHFREE_API_KEY;
const CF_SECRET = process.env.CASHFREE_SECRET_KEY;
const CF_API_VERSION = process.env.CASHFREE_API_VERSION || "2023-08-01";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000"; // Important for return URLs
/**
 * Maps an uppercase status from Cashfree to the lowercase status used in our database model.
 * @param cashfreeStatus - The status string from the Cashfree webhook (e.g., 'ACTIVE').
 * @returns The corresponding lowercase status for our IUser model.
 */
const mapCashfreeStatus = (cashfreeStatus) => {
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
const getAllPlans = () => __awaiter(void 0, void 0, void 0, function* () {
    return Plan_1.default.find({}).sort({ price: 1 });
});
/**
 * Creates a subscription in Cashfree and saves its initial state to our database.
 * @param user - The user for whom to create the subscription.
 * @param dbPlanId - The ObjectId of the plan from our database.
 * @returns Details needed by the frontend to start the checkout process.
 */
// In src/services/subscription.service.ts
const createSubscription = (user, dbPlanId) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    const plan = (yield Plan_1.default.findById(dbPlanId).exec());
    if (!plan || !plan.cashfreePlanId) {
        throw new Error("Subscription plan not found or is missing a Cashfree Plan ID.");
    }
    // --- THIS IS THE CORRECTED PAYLOAD STRUCTURE ---
    const payload = {
        customer_details: {
            customer_id: user._id.toString(),
            customer_email: user.email,
            customer_phone: user.phone || "9999999999",
        },
        order_meta: {
            return_url: `${FRONTEND_URL}/subscription/status?order_id={order_id}`,
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
        cfResp = yield axios_1.default.post(`${CF_BASE}/orders`, payload, {
            headers: {
                "Content-Type": "application/json",
                "x-client-id": CF_KEY,
                "x-client-secret": CF_SECRET,
                "x-api-version": "2023-08-01",
            },
        });
    }
    catch (err) {
        console.error("Cashfree order create failed:", (_a = err.response) === null || _a === void 0 ? void 0 : _a.data);
        const details = (_b = err.response) === null || _b === void 0 ? void 0 : _b.data;
        throw new Error(`Failed to create order: ${(details === null || details === void 0 ? void 0 : details.message) || "Unknown error"}`);
    }
    const paymentSessionId = (_c = cfResp.data) === null || _c === void 0 ? void 0 : _c.payment_session_id;
    const orderId = (_d = cfResp.data) === null || _d === void 0 ? void 0 : _d.order_id;
    if (!paymentSessionId || !orderId) {
        console.error("Cashfree response was missing 'payment_session_id' or 'order_id':", cfResp.data);
        throw new Error("Cashfree did not return a valid payment session.");
    }
    // The rest of the function remains the same
    user.subscription.status = "initialized";
    // user.subscription.orderId = orderId; // Optional
    yield user.save();
    return {
        paymentSessionId,
        orderId,
        amount: plan.price,
        planName: plan.name,
    };
});
/**
 * Verifies the signature of an incoming webhook from Cashfree to ensure it's authentic.
 * @param rawBody - The raw, unparsed request body string.
 * @param headers - The request headers object containing the signature.
 * @returns The parsed and verified webhook event data.
 */
const verifyCashfreeWebhook = (rawBody, headers) => {
    console.log("   [Service: verifyCashfreeWebhook] Iniciando verificação...");
    const signature = headers["x-webhook-signature"];
    const timestamp = headers["x-webhook-timestamp"];
    const secretKey = process.env.CASHFREE_SECRET_KEY;
    if (!signature || !timestamp) {
        // Essa verificação é redundante, pois já está no controller, mas é uma boa proteção
        throw new Error("Webhook Error: Cabeçalhos de assinatura ou timestamp ausentes no serviço.");
    }
    const stringToSign = timestamp + rawBody;
    const expectedSignature = crypto_1.default
        .createHmac("sha256", secretKey)
        .update(stringToSign)
        .digest("base64");
    console.log(`     - Assinatura Recebida: ${signature}`);
    console.log(`     - Assinatura Esperada: ${expectedSignature}`);
    if (signature !== expectedSignature) {
        console.error("     - ERRO: A assinatura não corresponde!");
        throw new Error("Webhook Error: Assinatura inválida.");
    }
    console.log("   [Service: verifyCashfreeWebhook] A verificação foi bem-sucedida.");
    return JSON.parse(rawBody);
};
const handleWebhookEvent = (event) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(`   [Service: handleWebhookEvent] Processando o evento do tipo: ${event.type}`);
    const subscriptionData = event.data.subscription;
    if (!(subscriptionData === null || subscriptionData === void 0 ? void 0 : subscriptionData.subscription_id)) {
        throw new Error("Payload do webhook inválido: 'subscription.subscription_id' ausente.");
    }
    const subscriptionId = subscriptionData.subscription_id;
    console.log(`     - Procurando usuário com subscriptionId: ${subscriptionId}`);
    const user = yield User_1.default.findOne({
        "subscription.subscriptionId": subscriptionId,
    });
    if (!user) {
        // IMPORTANTE: Não lance um erro aqui, pois a Cashfree tentará reenviar. Simplesmente registre e saia.
        console.warn(`     - AVISO: Usuário não encontrado para o subscriptionId: ${subscriptionId}. Ignorando o evento.`);
        return;
    }
    console.log(`     - Usuário encontrado: ${user.email}`);
    // (O resto da sua lógica de tratamento de eventos permanece a mesma)
    // ...
    yield user.save();
    console.log(`   [Service: handleWebhookEvent] Usuário ${user.email} atualizado com sucesso com o status: ${user.subscription.status}`);
});
// const verifyCashfreeWebhook = (
//   rawBody: string,
//   headers: Record<string, any>
// ): CashfreeWebhookEvent => {
//   const signature = headers["x-webhook-signature"];
//   const timestamp = headers["x-webhook-timestamp"];
//   if (!signature || !timestamp) {
//     throw new Error(
//       "Webhook Error: Missing 'x-webhook-signature' or 'x-webhook-timestamp' in headers."
//     );
//   }
//   const stringToSign = timestamp + rawBody;
//   const expectedSignature = crypto
//     .createHmac("sha256", CF_SECRET)
//     .update(stringToSign)
//     .digest("base64");
//   if (signature !== expectedSignature) {
//     throw new Error("Webhook Error: Invalid signature.");
//   }
//   console.log("Cashfree webhook signature verified successfully.");
//   return JSON.parse(rawBody);
// };
/**
 * Processes a verified webhook event to update subscription status in the database.
 * This function now explicitly handles different event types for success and failure.
 * @param event - The verified webhook event object from Cashfree.
 */
// const handleWebhookEvent = async (
//   event: CashfreeWebhookEvent
// ): Promise<void> => {
//   console.log(`Processing Cashfree webhook event: ${event.type}`);
//   const subscriptionData = event.data.subscription;
//   if (!subscriptionData?.subscription_id) {
//     console.error(
//       "Webhook event is missing subscription data or subscription_id."
//     );
//     return;
//   }
//   const user = await User.findOne({
//     "subscription.subscriptionId": subscriptionData.subscription_id,
//   });
//   if (!user) {
//     console.error(
//       `User not found for subscription_id: ${subscriptionData.subscription_id}. Ignoring event.`
//     );
//     return;
//   }
//   const plan = await Plan.findById(user.subscription.planId);
//   if (!plan) {
//     console.error(
//       `Plan not found for user: ${user._id} during webhook processing.`
//     );
//     return;
//   }
//   // --- ENHANCED LOGIC FOR HANDLING DIFFERENT SCENARIOS ---
//   switch (event.type) {
//     // --- SUCCESS SCENARIO ---
//     case "SUBSCRIPTION_PAYMENT_SUCCESS":
//       console.log(`SUCCESS event for user ${user.email}.`);
//       user.subscription.status = "active";
//       // Set the end date only if the subscription is newly activated
//       if (
//         !user.subscription.endDate ||
//         new Date() > user.subscription.endDate
//       ) {
//         const endDate = new Date();
//         endDate.setMonth(endDate.getMonth() + plan.durationMonths);
//         user.subscription.endDate = endDate;
//         console.log(
//           `Subscription activated. End date set to: ${endDate.toISOString()}`
//         );
//       }
//       break;
//     // This event also indicates a potential move to an active state
//     case "SUBSCRIPTION_STATUS_UPDATE":
//       const newStatus = mapCashfreeStatus(subscriptionData.status);
//       console.log(
//         `STATUS_UPDATE event for user ${user.email}. New status: ${newStatus}`
//       );
//       user.subscription.status = newStatus;
//       // Also check if it's becoming active
//       if (
//         newStatus === "active" &&
//         (!user.subscription.endDate || new Date() > user.subscription.endDate)
//       ) {
//         const endDate = new Date();
//         endDate.setMonth(endDate.getMonth() + plan.durationMonths);
//         user.subscription.endDate = endDate;
//         console.log(
//           `Subscription activated via status update. End date set to: ${endDate.toISOString()}`
//         );
//       }
//       break;
//     // --- FAILED SCENARIO ---
//     case "SUBSCRIPTION_PAYMENT_FAILED":
//       console.log(`FAILED event for user ${user.email}.`);
//       // Set status to 'on_hold' to indicate an issue that needs attention
//       user.subscription.status = "on_hold";
//       console.log(`Subscription status set to 'on_hold'.`);
//       break;
//     default:
//       console.log(
//         `Received unhandled event type: ${event.type}. No action taken.`
//       );
//       return; // Exit without saving if the event is not one we handle explicitly
//   }
//   await user.save();
//   console.log(
//     `Successfully updated user ${user.email} with status: ${user.subscription.status}`
//   );
// };
/**
 * Checks the subscription status for a given user.
 * @param userId The ID of the user to check.
 * @returns An object with the user's subscription status, plan name, and end date.
 */
const getSubscriptionStatus = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.default.findById(userId).populate("subscription.planId");
    if (!user || !user.subscription || !user.subscription.status) {
        return { isActive: false, planName: null, endDate: null };
    }
    const { status, endDate, planId } = user.subscription;
    // 👇 Safely cast populated planId to IPlan
    const plan = planId;
    // Handle expired active subscription
    if (status === "active" && endDate && new Date() > endDate) {
        console.log(`Subscription for user ${user.email} has expired. Updating status to inactive.`);
        user.subscription.status = "inactive";
        yield user.save();
        return { isActive: false, planName: null, endDate: null };
    }
    if (status === "active") {
        return {
            isActive: true,
            planName: (plan === null || plan === void 0 ? void 0 : plan.name) || "Active Plan",
            endDate: endDate || null,
        };
    }
    return { isActive: false, planName: null, endDate: null };
});
// --- EXPORT THE SERVICE ---
exports.subscriptionService = {
    getAllPlans,
    createSubscription,
    verifyCashfreeWebhook,
    handleWebhookEvent,
    getSubscriptionStatus,
};
