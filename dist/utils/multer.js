"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid"); // Using uuid for unique filenames
// Define the maximum file size from environment variables, with a default of 5MB
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "5242880");
/**
 * @description Defines the storage configuration for Multer.
 * Files will be saved to the 'uploads/' directory.
 */
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        // Generate a unique filename using uuid and preserve the original extension
        const uniqueSuffix = (0, uuid_1.v4)();
        const extension = path_1.default.extname(file.originalname);
        cb(null, `${uniqueSuffix}${extension}`);
    },
});
/**
 * @description Defines the file filter for Multer.
 * It ensures that only image files (jpeg, jpg, png, gif) are accepted.
 */
const fileFilter = (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const mimetype = allowedTypes.test(file.mimetype);
    const extname = allowedTypes.test(path_1.default.extname(file.originalname).toLowerCase());
    if (mimetype && extname) {
        return cb(null, true);
    }
    // Reject the file with an error message
    cb(new Error("File upload only supports the following filetypes: jpeg, jpg, png, gif"));
};
/**
 * @description The configured Multer instance.
 * It includes storage settings, file size limits, and the file filter.
 */
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: MAX_FILE_SIZE },
    fileFilter: fileFilter,
});
