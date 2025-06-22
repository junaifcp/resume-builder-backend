// ---- FILE: src/controllers/resumeController.ts ----

import { Request, Response } from "express";
import { resumeService } from "../services/resume.service";
import { IUser } from "../models/User";

export const createResume = async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;
  const newResume = await resumeService.createResume(
    user._id as import("mongodb").ObjectId,
    req.body
  );
  res.status(201).json(newResume);
};

export const getAllResumes = async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;
  const resumes = await resumeService.getAllResumesForUser(
    user._id as import("mongodb").ObjectId
  );
  res.status(200).json(resumes);
};

export const getResumeById = async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;
  const resume = await resumeService.getResumeById(
    req.params.id,
    user._id as import("mongodb").ObjectId
  );
  if (!resume) {
    return res.status(404).json({
      message: "Resume not found or you are not authorized to view it.",
    });
  }
  res.status(200).json(resume);
};

export const updateResume = async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;
  const updatedResume = await resumeService.updateResume(
    req.params.id,
    user._id as import("mongodb").ObjectId,
    req.body
  );
  if (!updatedResume) {
    return res.status(404).json({ message: "Resume not found." });
  }
  res.status(200).json(updatedResume);
};

export const deleteResume = async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;
  const deletedResume = await resumeService.deleteResume(
    req.params.id,
    user._id as import("mongodb").ObjectId
  );
  if (!deletedResume) {
    return res.status(404).json({ message: "Resume not found." });
  }
  res.status(204).send(); // 204 No Content is standard for successful deletions
};

export const duplicateResume = async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;
  const newResume = await resumeService.duplicateResume(
    req.params.id,
    user._id as import("mongodb").ObjectId
  );
  res.status(201).json(newResume);
};
