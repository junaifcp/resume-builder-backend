import { Request, Response } from "express";
import Resume from "../models/Resume";
import { CoverLetter } from "../models/CoverLetter";
import { IUser } from "../models/User";

export const getUserStats = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as IUser;

    const [resumeCount, coverLetterCount] = await Promise.all([
      Resume.countDocuments({ userId: user._id }),
      CoverLetter.countDocuments({ userId: user._id }),
    ]);

    // If you track applications and credits, fetch them here
    const applicationsSent = 0; // replace with real query if you store applications
    const creditsRemaining = "∞"; // or fetch from subscription plan

    res.status(200).json({
      resumeCount,
      coverLetterCount,
      applicationsSent,
      creditsRemaining,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch user stats",
      details: (error as Error).message,
    });
  }
};
