"use strict";
// ---- FILE: src/services/resume.service.ts ----
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resumeService = void 0;
const Resume_1 = __importDefault(require("../models/Resume"));
const uuid_1 = require("uuid");
const createResume = (userId, resumeData) => __awaiter(void 0, void 0, void 0, function* () {
    const newResume = new Resume_1.default(Object.assign(Object.assign({}, resumeData), { userId: userId, id: (0, uuid_1.v4)() }));
    yield newResume.save();
    return newResume;
});
const getResumeById = (resumeId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return Resume_1.default.findOne({ _id: resumeId, userId: userId });
});
const getAllResumesForUser = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    return Resume_1.default.find({ userId: userId }).sort({ updatedAt: -1 });
});
const updateResume = (resumeId, userId, updateData) => __awaiter(void 0, void 0, void 0, function* () {
    return Resume_1.default.findOneAndUpdate({ _id: resumeId, userId: userId }, { $set: Object.assign(Object.assign({}, updateData), { lastUpdated: new Date() }) }, { new: true });
});
const deleteResume = (resumeId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    return Resume_1.default.findOneAndDelete({ _id: resumeId, userId: userId });
});
const duplicateResume = (resumeId, userId) => __awaiter(void 0, void 0, void 0, function* () {
    const originalResume = yield Resume_1.default.findOne({
        _id: resumeId,
        userId: userId,
    }).lean();
    if (!originalResume) {
        throw new Error("Original resume not found or you are not authorized to access it.");
    }
    const { _id, createdAt, updatedAt } = originalResume, copyData = __rest(originalResume, ["_id", "createdAt", "updatedAt"]);
    const duplicatedResume = new Resume_1.default(Object.assign(Object.assign({}, copyData), { name: `${originalResume.name} (Copy)`, id: (0, uuid_1.v4)(), lastUpdated: new Date() }));
    yield duplicatedResume.save();
    return duplicatedResume;
});
exports.resumeService = {
    createResume,
    getResumeById,
    getAllResumesForUser,
    updateResume,
    deleteResume,
    duplicateResume,
};
