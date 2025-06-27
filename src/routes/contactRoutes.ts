import { Router } from "express";
import { submitContactMessage } from "../controllers/contactController";

const router = Router();

const asyncHandler = (fn: any) => (req: any, res: any, next: any) =>
  Promise.resolve(fn(req, res, next)).catch(next);

router.post("/", asyncHandler(submitContactMessage));

export default router;
