// src/controllers/atsController.ts
import { Request, Response } from "express";
import { computeATSSoreForResume } from "../services/ats.service";

export const getATSSCore = async (req: Request, res: Response) => {
  try {
    const { resumeId, jobDescription, options } = req.body;
    if (!resumeId)
      return res.status(400).json({ message: "resumeId is required" });

    const result = await computeATSSoreForResume(
      resumeId,
      jobDescription,
      options
    );
    return res.status(200).json(result);
  } catch (err: any) {
    console.error("ATS error", err);
    return res.status(500).json({ message: err.message || "Internal error" });
  }
};
