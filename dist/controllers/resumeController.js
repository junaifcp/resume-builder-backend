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
exports.duplicateResume = exports.deleteResume = exports.updateResume = exports.getResumeById = exports.getAllResumes = exports.createResume = void 0;
const resume_service_1 = require("../services/resume.service");
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
