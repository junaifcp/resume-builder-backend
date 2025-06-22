// ---- FILE: src/services/resume.service.ts ----

import Resume, { IResume } from "../models/Resume";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

const createResume = async (
  userId: mongoose.Types.ObjectId,
  resumeData: Partial<IResume>
): Promise<IResume> => {
  const newResume = new Resume({
    ...resumeData,
    userId: userId,
    id: uuidv4(), // Generate a unique UUID for frontend use
  });
  await newResume.save();
  return newResume;
};

const getResumeById = async (
  resumeId: string,
  userId: mongoose.Types.ObjectId
): Promise<IResume | null> => {
  return Resume.findOne({ _id: resumeId, userId: userId });
};

const getAllResumesForUser = async (
  userId: mongoose.Types.ObjectId
): Promise<IResume[]> => {
  return Resume.find({ userId: userId }).sort({ updatedAt: -1 });
};

const updateResume = async (
  resumeId: string,
  userId: mongoose.Types.ObjectId,
  updateData: Partial<IResume>
): Promise<IResume | null> => {
  return Resume.findOneAndUpdate(
    { _id: resumeId, userId: userId },
    { $set: { ...updateData, lastUpdated: new Date() } },
    { new: true }
  );
};

const deleteResume = async (
  resumeId: string,
  userId: mongoose.Types.ObjectId
): Promise<IResume | null> => {
  return Resume.findOneAndDelete({ _id: resumeId, userId: userId });
};

const duplicateResume = async (
  resumeId: string,
  userId: mongoose.Types.ObjectId
): Promise<IResume> => {
  const originalResume = await Resume.findOne({
    _id: resumeId,
    userId: userId,
  }).lean();

  if (!originalResume) {
    throw new Error(
      "Original resume not found or you are not authorized to access it."
    );
  }

  const { _id, createdAt, updatedAt, ...copyData } = originalResume;

  const duplicatedResume = new Resume({
    ...copyData,
    name: `${originalResume.name} (Copy)`,
    id: uuidv4(), // Generate a new unique ID
    lastUpdated: new Date(),
  });

  await duplicatedResume.save();
  return duplicatedResume;
};

export const resumeService = {
  createResume,
  getResumeById,
  getAllResumesForUser,
  updateResume,
  deleteResume,
  duplicateResume,
};
