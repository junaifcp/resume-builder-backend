// src/routes/jobRoutes.ts
import { Router } from "express";
import { searchJobs } from "../controllers/jobController";

const router = Router();

// Utility to wrap async route handlers
const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// POST /api/jobs/search
router.route("/search").post(asyncHandler(searchJobs));

export default router;
