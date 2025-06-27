"use strict";
// ---- FILE: src/routes/resumeRoutes.ts ----
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resumeController_1 = require("../controllers/resumeController");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
// We use memoryStorage because we are just forwarding the file, not saving it to disk.
const multer_1 = __importDefault(require("multer"));
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB file size limit
    },
});
const router = (0, express_1.Router)();
// Utility to wrap async route handlers and forward errors to Express
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// Note: The clerkAuth middleware is applied to this entire router in app.ts
// Routes for the collection of resumes
router
    .route("/")
    .get(asyncHandler(resumeController_1.getAllResumes))
    .post((0, validationMiddleware_1.validate)(validationSchemas_1.resumeValidationSchema), asyncHandler(resumeController_1.createResume));
/**
 * @route   POST /api/resumes/scrap
 * @desc    Uploads a resume file and returns parsed JSON data.
 * @access  Private (Authenticated users only)
 */
router.post("/scrape", upload.single("resume"), asyncHandler(resumeController_1.scrapResumeToText));
// Routes for a specific resume by its ID
router
    .route("/:id")
    .get(asyncHandler(resumeController_1.getResumeById))
    .put((0, validationMiddleware_1.validate)(validationSchemas_1.resumeValidationSchema), asyncHandler(resumeController_1.updateResume))
    .delete(asyncHandler(resumeController_1.deleteResume));
// A user needs an active subscription to view/download a single resume
/**
 * @route   POST /api/resumes/:id/duplicate
 * @desc    Creates a copy of an existing resume.
 * @access  Private (Authenticated users only)
 */
router.post("/:id/duplicate", asyncHandler(resumeController_1.duplicateResume));
// router.post("/:id/duplicate", asyncHandler(duplicateResume));
exports.default = router;
