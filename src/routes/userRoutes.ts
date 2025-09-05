import { Router } from "express";
import { getUserStats } from "../controllers/userStatsController";

const router = Router();

// Utility to wrap async route handlers
const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get("/stats", asyncHandler(getUserStats));

export default router;
