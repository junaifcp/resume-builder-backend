// src/controllers/jobController.ts
import { Request, Response } from "express";
import { jobService } from "../services/job.service";

export const searchJobs = async (req: Request, res: Response) => {
  try {
    // Accept payload from body (frontend posts JSON)
    const {
      keywords = "Software developer",
      location = "India",
      page = 1,
    } = req.body ?? {};

    if (!keywords || typeof keywords !== "string") {
      return res.status(400).json({ error: "keywords (string) is required" });
    }

    const pageNum = Number(page) || 1;

    const result = await jobService.searchJobs(keywords, location, pageNum);

    // Return exactly what frontend expects
    return res.status(200).json({
      totalCount: result.totalCount,
      jobs: result.jobs,
    });
  } catch (err: any) {
    console.error("jobController.searchJobs error:", err?.message ?? err);
    return res.status(500).json({
      error: "Failed to fetch jobs from provider",
      details: err?.message ?? err,
    });
  }
};
