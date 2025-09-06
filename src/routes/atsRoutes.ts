import { Router } from "express";
import { getATSSCore } from "../controllers/atsController";
import { validate } from "../middleware/validationMiddleware";
import { coverLetterValidationSchema } from "../utils/validationSchemas";

const router = Router();

// Utility to wrap async route handlers
const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Routes for a specific cover letter by its ID
router.route("/get-ats-score").post(asyncHandler(getATSSCore));

export default router;
