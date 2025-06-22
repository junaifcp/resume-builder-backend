// ---- FILE: src/controllers/uploadController.ts ----

import { Request, Response, RequestHandler } from "express";
import fs from "fs";
import path from "path";

export const uploadProfileImage: RequestHandler = (req, res) => {
  if (!req.file) {
    res.status(400).json({ message: "No file was uploaded." });
    return;
  }
  const filePath = `/uploads/${req.file.filename}`;
  res.status(201).json({ message: "File uploaded successfully.", filePath });
};

export const deleteProfileImage: RequestHandler = (req, res) => {
  const { filename } = req.params;
  if (filename.includes("..") || filename.includes("/")) {
    res.status(400).json({ message: "Invalid filename." });
    return;
  }
  const filePath = path.join(__dirname, "../../uploads", filename);
  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        res.status(500).json({ message: "Could not delete the file." });
        return;
      }
      res.status(204).send();
    });
  } else {
    res.status(404).json({ message: "File not found." });
  }
};
