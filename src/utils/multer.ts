import multer, { FileFilterCallback } from "multer";
import path from "path";
import { Request } from "express";
import { v4 as uuidv4 } from "uuid"; // Using uuid for unique filenames

// Define the maximum file size from environment variables, with a default of 5MB
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || "5242880");

/**
 * @description Defines the storage configuration for Multer.
 * Files will be saved to the 'uploads/' directory.
 */
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, "uploads/");
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate a unique filename using uuid and preserve the original extension
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

/**
 * @description Defines the file filter for Multer.
 * It ensures that only image files (jpeg, jpg, png, gif) are accepted.
 */
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );

  if (mimetype && extname) {
    return cb(null, true);
  }

  // Reject the file with an error message
  cb(
    new Error(
      "File upload only supports the following filetypes: jpeg, jpg, png, gif"
    )
  );
};

/**
 * @description The configured Multer instance.
 * It includes storage settings, file size limits, and the file filter.
 */
export const upload = multer({
  storage: storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: fileFilter,
});
