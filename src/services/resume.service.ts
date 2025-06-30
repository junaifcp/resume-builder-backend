// ---- FILE: src/services/resume.service.ts ----

import Resume, { IResume } from "../models/Resume";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";
import axios from "axios";
import FormData from "form-data";

// --- Constants for External API ---
const EXTERNAL_RESUME_API_URL = process.env.EXTERNAL_RESUME_API_URL!;
const RESUME_API_KEY = process.env.RESUME_API_KEY!;

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

/**
 * Sends a resume file to an external service for parsing.
 * @param fileBuffer The buffer of the uploaded file.
 * @param originalname The original name of the file.
 * @param mimetype The mimetype of the file.
 * @returns The parsed data from the external API.
 */
const scrapResume = async (
  fileBuffer: Buffer,
  originalname: string,
  mimetype: string
): Promise<any> => {
  const form = new FormData();
  form.append("file", fileBuffer, {
    filename: originalname,
    contentType: mimetype,
  });

  try {
    const response = await axios.post(EXTERNAL_RESUME_API_URL, form, {
      headers: {
        ...form.getHeaders(),
        Authorization: `Api-Key ${RESUME_API_KEY}`,
      },
    });
    // The external API wraps its response in a 'data' object.
    return response.data;
  } catch (error) {
    console.error("Error calling external resume parser:", error);
    // Re-throw the error to be handled by the controller
    throw error;
  }
};

/**
 * Calls the external Python API with raw resume text to get parsed data.
 * @param text - The raw text extracted from the resume.
 * @returns The JSON response from the parsing API.
 */
const scrapResumeFromText = async (text: string): Promise<any> => {
  // This URL points to your new endpoint that accepts raw text.
  const TEXT_PARSER_API_URL = `${process.env.EXTERNAL_API_BASE_URL}/api/resume/resume-text-parse/`;

  try {
    const response = await axios.post(
      TEXT_PARSER_API_URL,
      { text }, // The request body is a JSON object with a "text" key.
      {
        headers: {
          "Content-Type": "application/json", // Set content type to JSON.
          Authorization: `Api-Key ${process.env.RESUME_API_KEY}`,
        },
      }
    );
    // The external API wraps its response in a 'data' object.
    return response.data;
  } catch (error) {
    console.error("Error calling external resume text parser:", error);
    // Re-throw the error to be handled by the controller's error handling logic.
    throw error;
  }
};

const getPublicResumeById = async (
  resumeId: string,
  userId?: mongoose.Types.ObjectId
): Promise<IResume | null> => {
  if (userId) {
    return Resume.findOne({ _id: resumeId, userId: userId });
  }
  return Resume.findById(resumeId);
};

export const resumeService = {
  createResume,
  getPublicResumeById,
  getResumeById,
  getAllResumesForUser,
  updateResume,
  deleteResume,
  duplicateResume,
  scrapResume,
  scrapResumeFromText,
};
