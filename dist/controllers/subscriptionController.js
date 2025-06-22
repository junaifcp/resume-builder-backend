"use strict";
// ---- FILE: src/controllers/subscriptionController.ts ----
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
exports.handleCashfreeWebhook = exports.createPlan = exports.checkUserSubscriptionStatus = exports.createSubscription = exports.getPlans = void 0;
const subscription_service_1 = require("../services/subscription.service");
const Plan_1 = __importDefault(require("../models/Plan"));
const axios_1 = __importDefault(require("axios"));
const CF_BASE = process.env.CASHFREE_ENVIRONMENT_URL; // e.g. https://sandbox.cashfree.com/pg
const CF_KEY = process.env.CASHFREE_API_KEY;
const CF_SECRET = process.env.CASHFREE_SECRET_KEY;
const CF_API_VERSION = "2023-08-01";
const getPlans = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const plans = yield subscription_service_1.subscriptionService.getAllPlans();
    res.status(200).json(plans);
});
exports.getPlans = getPlans;
const createSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const { planId } = req.body;
    try {
        const details = yield subscription_service_1.subscriptionService.createSubscription(user, planId);
        res.status(201).json(Object.assign({ success: true }, details));
    }
    catch (err) {
        console.error("Subscription creation error:", err);
        res.status(err.status || 500).json(Object.assign({ success: false, message: err.message }, (err.details && { error: err.details })));
    }
});
exports.createSubscription = createSubscription;
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
const checkUserSubscriptionStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // Assumes an authentication middleware has attached the user object to the request
        const user = req.user;
        if (!user) {
            return res
                .status(401)
                .json({ success: false, message: "Authentication required." });
        }
        const statusDetails = yield subscription_service_1.subscriptionService.getSubscriptionStatus(user._id.toString());
        res.status(200).json(Object.assign({ success: true }, statusDetails));
    }
    catch (error) {
        console.error("Error checking subscription status:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check subscription status.",
        });
    }
});
exports.checkUserSubscriptionStatus = checkUserSubscriptionStatus;
const createPlan = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    const { name, price, durationMonths } = req.body;
    try {
        // 1. Create plan on Cashfree
        const cfResp = yield axios_1.default.post(`${CF_BASE}/plans`, {
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
        }, {
            headers: {
                "Content-Type": "application/json",
                "x-client-id": CF_KEY,
                "x-client-secret": CF_SECRET,
                "x-api-version": CF_API_VERSION,
            },
        });
        const cashfreePlanId = (_a = cfResp.data) === null || _a === void 0 ? void 0 : _a.plan_id;
        if (!cashfreePlanId) {
            throw new Error("Cashfree did not return a plan_id");
        }
        // 2. Persist locally
        const newPlan = yield Plan_1.default.create({
            name,
            cashfreePlanId,
            price,
            durationMonths,
        });
        res.status(201).json({
            success: true,
            plan: newPlan,
        });
    }
    catch (err) {
        console.error("❌ Cashfree plan creation failed:", ((_b = err.response) === null || _b === void 0 ? void 0 : _b.data) || err.message);
        res.status(500).json({
            success: false,
            message: "Failed to create plan",
            error: ((_c = err.response) === null || _c === void 0 ? void 0 : _c.data) || err.message,
        });
    }
});
exports.createPlan = createPlan;
/**
 * Handles incoming webhooks from Cashfree.
 */
const handleCashfreeWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log("\n---  recebido webhook da Cashfree ---");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    try {
        const rawBody = req.rawBody;
        console.log("1. Verificando se o corpo bruto existe...");
        if (!rawBody) {
            throw new Error("Corpo bruto ausente. Verifique a configuração do middleware de verificação.");
        }
        console.log("   - Corpo bruto encontrado. Comprimento:", rawBody.length);
        // console.log("   - Corpo bruto (primeiros 200 caracteres):", rawBody.substring(0, 200)); // Descomente para depuração profunda
        console.log("2. Verificando cabeçalhos do webhook...");
        // console.log("   - Cabeçalhos recebidos:", JSON.stringify(req.headers, null, 2)); // Descomente para ver todos os cabeçalhos
        if (!req.headers["x-webhook-signature"] ||
            !req.headers["x-webhook-timestamp"]) {
            throw new Error("Cabeçalhos de assinatura ou timestamp do webhook ausentes.");
        }
        console.log("   - Cabeçalhos de assinatura e timestamp encontrados.");
        console.log("3. Chamando o serviço para verificar a assinatura...");
        const verifiedEvent = subscription_service_1.subscriptionService.verifyCashfreeWebhook(rawBody, req.headers);
        console.log("   - Assinatura do webhook VERIFICADA com sucesso.");
        console.log("4. Chamando o serviço para lidar com o evento...");
        // console.log("   - Dados do evento verificado:", JSON.stringify(verifiedEvent, null, 2)); // Descomente para ver o payload completo
        yield subscription_service_1.subscriptionService.handleWebhookEvent(verifiedEvent);
        console.log("   - Processamento do evento concluído com sucesso.");
        console.log("5. Enviando resposta 200 OK para a Cashfree.");
        res.status(200).json({ status: "success", message: "Webhook processed." });
    }
    catch (error) {
        console.error("💥 FALHA no processamento do webhook da Cashfree:", error.message);
        // Log do erro completo para depuração
        console.error(error);
        res.status(400).json({ status: "error", message: error.message });
    }
});
exports.handleCashfreeWebhook = handleCashfreeWebhook;
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
