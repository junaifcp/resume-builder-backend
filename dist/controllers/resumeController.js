"use strict";
// ---- FILE: src/controllers/resumeController.ts ----
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scrapResumeToText = exports.scrapResume = exports.duplicateResume = exports.deleteResume = exports.updateResume = exports.getResumeById = exports.getAllResumes = exports.createResume = void 0;
const resume_service_1 = require("../services/resume.service");
const resume_extractor_1 = require("../utils/resume-extractor");
const axios_1 = require("axios");
const createResume = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const newResume = yield resume_service_1.resumeService.createResume(user._id, req.body);
    res.status(201).json(newResume);
});
exports.createResume = createResume;
const getAllResumes = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const resumes = yield resume_service_1.resumeService.getAllResumesForUser(user._id);
    res.status(200).json(resumes);
});
exports.getAllResumes = getAllResumes;
const getResumeById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const resume = yield resume_service_1.resumeService.getResumeById(req.params.id, user._id);
    if (!resume) {
        return res.status(404).json({
            message: "Resume not found or you are not authorized to view it.",
        });
    }
    res.status(200).json(resume);
});
exports.getResumeById = getResumeById;
const updateResume = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const updatedResume = yield resume_service_1.resumeService.updateResume(req.params.id, user._id, req.body);
    if (!updatedResume) {
        return res.status(404).json({ message: "Resume not found." });
    }
    res.status(200).json(updatedResume);
});
exports.updateResume = updateResume;
const deleteResume = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const deletedResume = yield resume_service_1.resumeService.deleteResume(req.params.id, user._id);
    if (!deletedResume) {
        return res.status(404).json({ message: "Resume not found." });
    }
    res.status(204).send(); // 204 No Content is standard for successful deletions
});
exports.deleteResume = deleteResume;
const duplicateResume = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    const newResume = yield resume_service_1.resumeService.duplicateResume(req.params.id, user._id);
    res.status(201).json(newResume);
});
exports.duplicateResume = duplicateResume;
/**
 * @controller  scrapResume
 * @desc        Receives a resume file, passes it to the resumeService for parsing, and returns the result.
 */
const scrapResume = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded. Please include a file in the 'file' field.",
        });
    }
    try {
        const { buffer, originalname, mimetype } = req.file;
        const parsedData = yield resume_service_1.resumeService.scrapResume(buffer, originalname, mimetype);
        // The external API response structure is { success, message, data }
        // We will forward this structure to our client.
        res.status(200).json(parsedData);
    }
    catch (error) {
        // Handle errors from the external API call
        if ((0, axios_1.isAxiosError)(error)) {
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
            }
            else if (error.request) {
                // The request was made but no response was received
                return res.status(500).json({
                    success: false,
                    message: "Internal error: No response from the resume parser service.",
                });
            }
        }
        // For other types of errors
        return res.status(500).json({
            success: false,
            message: "An unexpected internal error occurred.",
        });
    }
});
exports.scrapResume = scrapResume;
/**
 * Handles the resume upload, extracts text locally, and sends the text
 * to an external service for parsing.
 */
const scrapResumeToText = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            message: "No file uploaded. Please include a file in the 'file' field.",
        });
    }
    try {
        // Step 1: Extract text from the uploaded file locally.
        const extractedText = yield (0, resume_extractor_1.extractTextFromFile)(req.file);
        if (!extractedText || extractedText.trim().length === 0) {
            return res.status(422).json({
                success: false,
                message: "Could not extract any text from the uploaded file.",
            });
        }
        // Step 2: Call the resume service with the extracted text.
        const parsedData = yield resume_service_1.resumeService.scrapResumeFromText(extractedText);
        // Step 3: Forward the successful response from the Python API to the client.
        res.status(200).json(parsedData);
    }
    catch (error) {
        // Handle errors from the local text extraction process.
        if (error instanceof Error &&
            error.message.startsWith("Failed to extract")) {
            return res.status(500).json({
                success: false,
                message: error.message,
            });
        }
        // Handle errors from the external API call (axios).
        if ((0, axios_1.isAxiosError)(error)) {
            if (error.response) {
                // The external API responded with an error.
                console.error("External API Error:", error.response.data);
                return res.status(error.response.status || 422).json({
                    success: false,
                    message: "Resume parsing failed via external API.",
                    error: error.response.data,
                });
            }
            else if (error.request) {
                // The request was made, but no response was received.
                return res.status(503).json({
                    success: false,
                    message: "No response from the resume parser service.",
                });
            }
        }
        // Handle any other unexpected errors.
        console.error("An unexpected error occurred:", error);
        return res.status(500).json({
            success: false,
            message: "An unexpected internal error occurred.",
        });
    }
});
exports.scrapResumeToText = scrapResumeToText;
