import { Router } from "express";
import express from "express"; // Import express to use the raw middleware
import { handleClerkWebhook } from "../controllers/authController";

const router = Router();

/**
 * @route   POST /api/webhooks/clerk
 * @desc    Handles user events from Clerk. This route must use the express.raw()
 * middleware to ensure the request body is a raw Buffer, which is
 * required by the Svix library for webhook signature verification.
 * @access  Public
 */
router.post(
  "/clerk",
  express.raw({ type: "application/json" }),
  handleClerkWebhook
);

export default router;
