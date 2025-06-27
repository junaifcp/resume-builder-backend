// filepath: /Users/imac/Documents/swift-resume-builder/resume-builder-backend/src/controllers/contactController.ts
import { Request, Response } from "express";
import ContactMessage from "../models/ContactMessage";

export const submitContactMessage = async (req: Request, res: Response) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const newMessage = await ContactMessage.create({
      name,
      email,
      subject,
      message,
    });
    res.status(201).json({ message: "Message received.", data: newMessage });
  } catch (error) {
    res.status(500).json({ message: "Failed to submit message." });
  }
};
