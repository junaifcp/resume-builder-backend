import { CoverLetter, ICoverLetter } from "../models/CoverLetter";
import { v4 as uuidv4 } from "uuid";
import mongoose from "mongoose";

// This check helps diagnose module resolution issues.
// If this error appears in your console, it confirms a circular dependency.
if (!CoverLetter) {
  throw new Error(
    "CoverLetter model failed to import, likely due to a circular dependency. Check your import statements."
  );
}

/**
 * Creates a new cover letter for a specific user.
 * @param userId - The ID of the user creating the cover letter.
 * @param coverLetterData - The data for the new cover letter.
 * @returns The newly created cover letter document.
 */
const createCoverLetter = async (
  userId: mongoose.Types.ObjectId,
  coverLetterData: Partial<ICoverLetter>
): Promise<ICoverLetter> => {
  const newCoverLetter = new CoverLetter({
    ...coverLetterData,
    userId: userId,
    id: uuidv4(),
  });
  await newCoverLetter.save();
  return newCoverLetter;
};

/**
 * Retrieves a single cover letter by its ID, ensuring it belongs to the user.
 * @param coverLetterId - The MongoDB _id of the cover letter.
 * @param userId - The ID of the user requesting the cover letter.
 * @returns The cover letter document or null if not found.
 */
const getCoverLetterById = async (
  coverLetterId: string,
  userId: mongoose.Types.ObjectId
): Promise<ICoverLetter | null> => {
  return CoverLetter.findOne({ _id: coverLetterId, userId: userId });
};

/**
 * Retrieves a paginated list of all cover letters for a specific user.
 * @param userId - The ID of the user.
 * @param page - The current page number.
 * @param limit - The number of items per page.
 * @returns A paginated response object.
 */
const getAllCoverLettersForUser = async (
  userId: mongoose.Types.ObjectId,
  page: number,
  limit: number
) => {
  const skip = (page - 1) * limit;

  const [total, coverLetters] = await Promise.all([
    CoverLetter.countDocuments({ userId }),
    CoverLetter.find({ userId: userId })
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    data: coverLetters,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

/**
 * Updates an existing cover letter.
 * @param coverLetterId - The ID of the cover letter to update.
 * @param userId - The ID of the user owning the cover letter.
 * @param updateData - The data to update.
 * @returns The updated cover letter document or null if not found.
 */
const updateCoverLetter = async (
  coverLetterId: string,
  userId: mongoose.Types.ObjectId,
  updateData: Partial<ICoverLetter>
): Promise<ICoverLetter | null> => {
  return CoverLetter.findOneAndUpdate(
    { _id: coverLetterId, userId: userId },
    { $set: updateData },
    { new: true }
  );
};

/**
 * Deletes a cover letter.
 * @param coverLetterId - The ID of the cover letter to delete.
 * @param userId - The ID of the user owning the cover letter.
 * @returns The deleted cover letter document or null if not found.
 */
const deleteCoverLetter = async (
  coverLetterId: string,
  userId: mongoose.Types.ObjectId
): Promise<ICoverLetter | null> => {
  return CoverLetter.findOneAndDelete({ _id: coverLetterId, userId: userId });
};

export const coverLetterService = {
  createCoverLetter,
  getCoverLetterById,
  getAllCoverLettersForUser,
  updateCoverLetter,
  deleteCoverLetter,
};
