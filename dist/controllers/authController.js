"use strict";
// controllers/authController.ts
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
exports.handleClerkWebhook = void 0;
const svix_1 = require("svix");
const User_1 = __importDefault(require("../models/User"));
const handleClerkWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    console.log("--- Clerk Webhook Handler Started ---");
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
    if (!WEBHOOK_SECRET) {
        console.error("FATAL ERROR: CLERK_WEBHOOK_SECRET is not set in .env file.");
        res
            .status(500)
            .send("Server configuration error: Webhook secret not found.");
        return;
    }
    // Extract Svix headers
    const svixId = req.headers["svix-id"];
    const svixTimestamp = req.headers["svix-timestamp"];
    const svixSignature = req.headers["svix-signature"];
    if (!svixId || !svixTimestamp || !svixSignature) {
        console.error("❌ Missing one or more Svix headers.");
        res.status(400).send("Missing Svix headers");
        return;
    }
    // Ensure raw body is a Buffer
    const buf = req.body;
    if (!Buffer.isBuffer(buf) || buf.length === 0) {
        console.error("❌ Request body not a valid Buffer.");
        res.status(400).send("Invalid webhook payload");
        return;
    }
    const payload = buf.toString("utf8");
    const wh = new svix_1.Webhook(WEBHOOK_SECRET);
    let evt;
    try {
        evt = wh.verify(payload, {
            "svix-id": svixId,
            "svix-timestamp": svixTimestamp,
            "svix-signature": svixSignature,
        });
        console.log(`🎉 Webhook verified: ${evt.type}`);
    }
    catch (err) {
        console.error("❌ Webhook verification failed:", err.message);
        res.status(400).json({ success: false, message: err.message });
        return;
    }
    // Common data extraction helper
    const extractUserData = (data) => {
        const clerkUserId = data.id;
        const email = Array.isArray(data.email_addresses) && data.email_addresses.length > 0
            ? data.email_addresses[0].email_address
            : data.email_address || "";
        const firstName = data.first_name || "";
        const lastName = data.last_name || "";
        const profileImageUrl = data.profile_image_url || "";
        return { clerkUserId, email, firstName, lastName, profileImageUrl };
    };
    try {
        if (evt.type === "user.created") {
            const data = evt.data;
            const { clerkUserId, email, firstName, lastName, profileImageUrl } = extractUserData(data);
            const existing = yield User_1.default.findOne({ clerkUserId });
            if (existing) {
                console.log(`User with Clerk ID ${clerkUserId} already exists.`);
            }
            else {
                const newUser = yield User_1.default.create({
                    clerkUserId,
                    email,
                    firstName,
                    lastName,
                    profileImageUrl,
                    subscription: { status: "inactive" },
                });
                console.log("✅ Created new user:", newUser._id.toString());
            }
        }
        else if (evt.type === "user.updated") {
            const data = evt.data;
            const { clerkUserId, email, firstName, lastName, profileImageUrl } = extractUserData(data);
            const updated = yield User_1.default.findOneAndUpdate({ clerkUserId }, { email, firstName, lastName, profileImageUrl }, { new: true });
            if (updated) {
                console.log("🔄 Updated user:", (_a = updated._id) === null || _a === void 0 ? void 0 : _a.toString());
            }
            else {
                console.warn(`⚠️ Received user.updated for unknown Clerk ID ${clerkUserId}.`);
            }
        }
        else {
            console.log(`↩️ Unhandled event type: ${evt.type}`);
        }
    }
    catch (err) {
        console.error("❌ Error handling webhook event:", err);
        // Still return 200 so Clerk doesn’t retry repeatedly on non‑fatal errors
    }
    console.log("--- Clerk Webhook Handler Finished Successfully ---");
    res.status(200).json({ success: true, message: "Webhook processed" });
});
exports.handleClerkWebhook = handleClerkWebhook;
// // In your /controllers/authController.ts file
// import { Request, Response } from "express";
// import { Webhook } from "svix";
// import { WebhookEvent } from "@clerk/clerk-sdk-node";
// // The function signature is updated to return Promise<void>
// export const handleClerkWebhook = async (
//   req: Request,
//   res: Response
// ): Promise<void> => {
//   console.log("--- Clerk Webhook Handler Started ---");
//   const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
//   if (!WEBHOOK_SECRET) {
//     console.error("FATAL ERROR: CLERK_WEBHOOK_SECRET is not set in .env file.");
//     // Send the response, then return to exit the function.
//     res
//       .status(500)
//       .send("Server configuration error: Webhook secret not found.");
//     return;
//   }
//   console.log("✅ Found CLERK_WEBHOOK_SECRET.");
//   const headers = req.headers;
//   const svix_id = headers["svix-id"] as string;
//   const svix_timestamp = headers["svix-timestamp"] as string;
//   const svix_signature = headers["svix-signature"] as string;
//   console.log("🔎 Received Svix Headers:");
//   console.log(`   - svix-id: ${svix_id}`);
//   console.log(`   - svix-timestamp: ${svix_timestamp}`);
//   console.log(`   - svix-signature: ${svix_signature}`);
//   if (!svix_id || !svix_timestamp || !svix_signature) {
//     console.error("❌ Error: Missing one or more Svix headers.");
//     res.status(400).send("Error occured -- no svix headers");
//     return;
//   }
//   console.log("✅ All Svix headers are present.");
//   const payload = req.body;
//   console.log("🔎 Checking request body...");
//   console.log(`   - Type of req.body: ${typeof payload}`);
//   console.log(`   - Is req.body a Buffer? ${Buffer.isBuffer(payload)}`);
//   if (!payload || !Buffer.isBuffer(payload) || payload.length === 0) {
//     console.error("❌ Error: Request body is not a valid, non-empty Buffer.");
//     res.status(400).send("Error occured -- invalid request body");
//     return;
//   }
//   console.log("✅ Request body is a valid Buffer.");
//   const payloadString = payload.toString("utf8");
//   const wh = new Webhook(WEBHOOK_SECRET);
//   let evt: WebhookEvent;
//   try {
//     console.log("⏳ Attempting to verify webhook with Svix...");
//     evt = wh.verify(payloadString, {
//       "svix-id": svix_id,
//       "svix-timestamp": svix_timestamp,
//       "svix-signature": svix_signature,
//     }) as WebhookEvent;
//     console.log("🎉 Webhook verification successful!");
//   } catch (err: any) {
//     console.error("---!!! Webhook verification FAILED !!!---");
//     console.error("   Error Message:", err.message);
//     res.status(400).json({
//       success: false,
//       message: err.message,
//     });
//     return;
//   }
//   const eventType = evt.type;
//   console.log(`✅ Handling event type: ${eventType}`);
//   if (eventType === "user.created") {
//     const { id } = evt.data;
//     console.log(`   - User created in Clerk: ${id}`);
//   }
//   console.log("--- Clerk Webhook Handler Finished Successfully ---");
//   // Send the final success response, then exit.
//   res.status(200).json({
//     success: true,
//     message: "Webhook received and processed",
//   });
// };
