// ---- FILE: src/routes/resumeRoutes.ts ----

import { Router } from "express";
import {
  createResume,
  getAllResumes,
  getResumeById,
  updateResume,
  deleteResume,
  duplicateResume,
  scrapResume,
} from "../controllers/resumeController";
import { checkActiveSubscription } from "../middleware/subscriptionMiddleware";
import { validate } from "../middleware/validationMiddleware";
import { resumeValidationSchema } from "../utils/validationSchemas";
// We use memoryStorage because we are just forwarding the file, not saving it to disk.
import multer from "multer";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB file size limit
  },
});
const router = Router();

// Utility to wrap async route handlers and forward errors to Express
const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Note: The clerkAuth middleware is applied to this entire router in app.ts

// Routes for the collection of resumes
router
  .route("/")
  .get(asyncHandler(getAllResumes))
  .post(validate(resumeValidationSchema), asyncHandler(createResume));

/**
 * @route   POST /api/resumes/scrap
 * @desc    Uploads a resume file and returns parsed JSON data.
 * @access  Private (Authenticated users only)
 */
router.post("/scrape", upload.single("resume"), asyncHandler(scrapResume));

// Routes for a specific resume by its ID
router
  .route("/:id")
  .get(asyncHandler(getResumeById))
  .put(validate(resumeValidationSchema), asyncHandler(updateResume))
  .delete(asyncHandler(deleteResume));
// A user needs an active subscription to view/download a single resume
/**
 * @route   POST /api/resumes/:id/duplicate
 * @desc    Creates a copy of an existing resume.
 * @access  Private (Authenticated users only)
 */
router.post("/:id/duplicate", asyncHandler(duplicateResume));

// router.post("/:id/duplicate", asyncHandler(duplicateResume));

export default router;
