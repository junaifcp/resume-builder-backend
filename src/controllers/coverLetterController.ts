import { Request, Response } from "express";
import { coverLetterService } from "../services/coverLetter.service";
import { IUser } from "../models/User"; // Assuming you have a User model interface

export const createCoverLetter = async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;
  const newCoverLetter = await coverLetterService.createCoverLetter(
    user._id as import("mongodb").ObjectId,
    req.body
  );
  res.status(201).json({
    success: true,
    data: newCoverLetter,
    message: "Cover letter created successfully.",
  });
};

export const getAllCoverLetters = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user as IUser;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const paginatedResult = await coverLetterService.getAllCoverLettersForUser(
      user._id as import("mongodb").ObjectId,
      page,
      limit
    );

    res.status(200).json({ success: true, ...paginatedResult });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to fetch cover letters.",
      details: (error as Error).message,
    });
  }
};

export const getCoverLetterById = async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;
  const coverLetter = await coverLetterService.getCoverLetterById(
    req.params.id,
    user._id as import("mongodb").ObjectId
  );
  if (!coverLetter) {
    return res
      .status(404)
      .json({ success: false, error: "Cover letter not found." });
  }
  res.status(200).json({ success: true, data: coverLetter });
};

export const updateCoverLetter = async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;
  const updatedCoverLetter = await coverLetterService.updateCoverLetter(
    req.params.id,
    user._id as import("mongodb").ObjectId,
    req.body
  );
  if (!updatedCoverLetter) {
    return res
      .status(404)
      .json({ success: false, error: "Cover letter not found." });
  }
  res.status(200).json({
    success: true,
    data: updatedCoverLetter,
    message: "Cover letter updated successfully.",
  });
};

export const deleteCoverLetter = async (req: Request, res: Response) => {
  const user = (req as any).user as IUser;
  const deleted = await coverLetterService.deleteCoverLetter(
    req.params.id,
    user._id as import("mongodb").ObjectId
  );
  if (!deleted) {
    return res
      .status(404)
      .json({ success: false, error: "Cover letter not found." });
  }
  res
    .status(200)
    .json({ success: true, message: "Cover letter deleted successfully." });
};
