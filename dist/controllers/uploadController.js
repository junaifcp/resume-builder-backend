"use strict";
// ---- FILE: src/controllers/uploadController.ts ----
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProfileImage = exports.uploadProfileImage = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const uploadProfileImage = (req, res) => {
    if (!req.file) {
        res.status(400).json({ message: "No file was uploaded." });
        return;
    }
    const filePath = `/uploads/${req.file.filename}`;
    res.status(201).json({ message: "File uploaded successfully.", filePath });
};
exports.uploadProfileImage = uploadProfileImage;
const deleteProfileImage = (req, res) => {
    const { filename } = req.params;
    if (filename.includes("..") || filename.includes("/")) {
        res.status(400).json({ message: "Invalid filename." });
        return;
    }
    const filePath = path_1.default.join(__dirname, "../../uploads", filename);
    if (fs_1.default.existsSync(filePath)) {
        fs_1.default.unlink(filePath, (err) => {
            if (err) {
                console.error("Error deleting file:", err);
                res.status(500).json({ message: "Could not delete the file." });
                return;
            }
            res.status(204).send();
        });
    }
    else {
        res.status(404).json({ message: "File not found." });
    }
};
exports.deleteProfileImage = deleteProfileImage;
