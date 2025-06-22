"use strict";
// ---- FILE: src/routes/uploadRoutes.ts ----
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const uploadController_1 = require("../controllers/uploadController");
const multer_1 = require("../utils/multer"); // The configured Multer instance
const router = (0, express_1.Router)();
// Note: The clerkAuth middleware is applied to this entire router in app.ts
/**
 * @route   POST /api/upload/profile-image
 * @desc    Upload a profile image for the logged-in user.
 * @access  Private
 */
router.post("/profile-image", multer_1.upload.single("profileImage"), // This middleware from Multer parses the file
uploadController_1.uploadProfileImage);
/**
 * @route   DELETE /api/upload/profile-image/:filename
 * @desc    Delete a previously uploaded profile image.
 * @access  Private
 */
router.delete("/profile-image/:filename", uploadController_1.deleteProfileImage);
exports.default = router;
