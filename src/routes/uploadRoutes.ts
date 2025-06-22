// ---- FILE: src/routes/uploadRoutes.ts ----

import { Router } from "express";
import {
  uploadProfileImage,
  deleteProfileImage,
} from "../controllers/uploadController";
import { upload } from "../utils/multer"; // The configured Multer instance

const router = Router();

// Note: The clerkAuth middleware is applied to this entire router in app.ts

/**
 * @route   POST /api/upload/profile-image
 * @desc    Upload a profile image for the logged-in user.
 * @access  Private
 */
router.post(
  "/profile-image",
  upload.single("profileImage"), // This middleware from Multer parses the file
  uploadProfileImage
);

/**
 * @route   DELETE /api/upload/profile-image/:filename
 * @desc    Delete a previously uploaded profile image.
 * @access  Private
 */
router.delete("/profile-image/:filename", deleteProfileImage);

export default router;
