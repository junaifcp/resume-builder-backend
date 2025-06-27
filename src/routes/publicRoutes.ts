import { Router } from "express";
import { getPublicResume } from "../controllers/resumeController";

const router = Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.get("/public/:id", asyncHandler(getPublicResume));

export default router;
