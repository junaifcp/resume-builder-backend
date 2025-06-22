"use strict";
// ---- FILE: src/routes/resumeRoutes.ts ----
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const resumeController_1 = require("../controllers/resumeController");
const validationMiddleware_1 = require("../middleware/validationMiddleware");
const validationSchemas_1 = require("../utils/validationSchemas");
const router = (0, express_1.Router)();
// Utility to wrap async route handlers and forward errors to Express
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
// Note: The clerkAuth middleware is applied to this entire router in app.ts
// Routes for the collection of resumes
router
    .route("/")
    .get(asyncHandler(resumeController_1.getAllResumes))
    .post((0, validationMiddleware_1.validate)(validationSchemas_1.resumeValidationSchema), asyncHandler(resumeController_1.createResume));
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
