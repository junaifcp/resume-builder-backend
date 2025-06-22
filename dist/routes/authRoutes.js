"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_2 = __importDefault(require("express")); // Import express to use the raw middleware
const authController_1 = require("../controllers/authController");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/webhooks/clerk
 * @desc    Handles user events from Clerk. This route must use the express.raw()
 * middleware to ensure the request body is a raw Buffer, which is
 * required by the Svix library for webhook signature verification.
 * @access  Public
 */
router.post("/clerk", express_2.default.raw({ type: "application/json" }), authController_1.handleClerkWebhook);
exports.default = router;
