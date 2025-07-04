import { Router } from "express";
import {
  createCoverLetter,
  getAllCoverLetters,
  getCoverLetterById,
  updateCoverLetter,
  deleteCoverLetter,
} from "../controllers/coverLetterController";
import { validate } from "../middleware/validationMiddleware";
import { coverLetterValidationSchema } from "../utils/validationSchemas";

const router = Router();

// Utility to wrap async route handlers
const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Routes for the collection of cover letters
router
  .route("/")
  .get(asyncHandler(getAllCoverLetters))
  .post(asyncHandler(createCoverLetter));
``;
//   .post(validate(coverLetterValidationSchema), asyncHandler(createCoverLetter));

// Routes for a specific cover letter by its ID
router
  .route("/:id")
  .get(asyncHandler(getCoverLetterById))
  .put(asyncHandler(updateCoverLetter))
  .delete(asyncHandler(deleteCoverLetter));

export default router;
