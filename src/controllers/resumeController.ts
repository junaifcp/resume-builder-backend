// ---- FILE: src/controllers/resumeController.ts ----

import { Request, Response } from "express";
import { resumeService } from "../services/resume.service";
import { IUser } from "../models/User";
// import { extractTextFromFile } from "../utils/resume-extractor";
import { isAxiosError } from "axios";
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

  // 1. Parse 'page' and 'limit' from the request query string.
  // 2. Provide default values if they are not specified.
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  // Call the updated service function with the user ID and pagination parameters
  const paginatedResumes = await resumeService.getAllResumesForUser(
    user._id as import("mongodb").ObjectId,
    page,
    limit
  );

  // Send the structured paginated response back to the client
  res.status(200).json(paginatedResumes);
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

/**
 * @controller  scrapResume
 * @desc        Receives a resume file, passes it to the resumeService for parsing, and returns the result.
 */
export const scrapResume = async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "No file uploaded. Please include a file in the 'file' field.",
    });
  }

  try {
    const { buffer, originalname, mimetype } = req.file;
    const parsedData = await resumeService.scrapResume(
      buffer,
      originalname,
      mimetype
    );

    // The external API response structure is { success, message, data }
    // We will forward this structure to our client.
    res.status(200).json(parsedData);
  } catch (error) {
    // Handle errors from the external API call
    if (isAxiosError(error)) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response) {
        console.error("External API Error:", error.response.data);
        // Mimic the 422 Unprocessable Entity status from the Python example
        return res.status(422).json({
          success: false,
          message: "Resume parsing failed via external API.",
          error: error.response.data,
        });
      } else if (error.request) {
        // The request was made but no response was received
        return res.status(500).json({
          success: false,
          message:
            "Internal error: No response from the resume parser service.",
        });
      }
    }
    // For other types of errors
    return res.status(500).json({
      success: false,
      message: "An unexpected internal error occurred.",
    });
  }
};

/**
 * @controller  getPublicResume
 * @desc        Serves a resume publicly by its ID (no authentication required).
 */
export const getPublicResume = async (req: Request, res: Response) => {
  const resume = await resumeService.getPublicResumeById(
    req.params.id,
    undefined // No userId check for public access
  );
  if (!resume) {
    return res.status(404).json({
      message: "Resume not found.",
    });
  }
  res.status(200).json(resume);
};

/**
 * Handles the resume upload, extracts text locally, and sends the text
 * to an external service for parsing.
 */
// export const scrapResumeToText = async (req: Request, res: Response) => {
//   if (!req.file) {
//     return res.status(400).json({
//       success: false,
//       message: "No file uploaded. Please include a file in the 'file' field.",
//     });
//   }

//   try {
//     // Step 1: Extract text from the uploaded file locally.
//     const extractedText = await extractTextFromFile(req.file);

//     if (!extractedText || extractedText.trim().length === 0) {
//       return res.status(422).json({
//         success: false,
//         message: "Could not extract any text from the uploaded file.",
//       });
//     }

//     // Step 2: Call the resume service with the extracted text.
//     const parsedData = await resumeService.scrapResumeFromText(extractedText);

//     // Step 3: Forward the successful response from the Python API to the client.
//     res.status(200).json(parsedData);
//   } catch (error) {
//     // Handle errors from the local text extraction process.
//     if (
//       error instanceof Error &&
//       error.message.startsWith("Failed to extract")
//     ) {
//       return res.status(500).json({
//         success: false,
//         message: error.message,
//       });
//     }

//     // Handle errors from the external API call (axios).
//     if (isAxiosError(error)) {
//       if (error.response) {
//         // The external API responded with an error.
//         console.error("External API Error:", error.response.data);
//         return res.status(error.response.status || 422).json({
//           success: false,
//           message: "Resume parsing failed via external API.",
//           error: error.response.data,
//         });
//       } else if (error.request) {
//         // The request was made, but no response was received.
//         return res.status(503).json({
//           success: false,
//           message: "No response from the resume parser service.",
//         });
//       }
//     }

//     // Handle any other unexpected errors.
//     console.error("An unexpected error occurred:", error);
//     return res.status(500).json({
//       success: false,
//       message: "An unexpected internal error occurred.",
//     });
//   }
// };
