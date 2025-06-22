import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export const globalErrorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const statusCode = err.statusCode || 500;

  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Validation failed",
      errors: err.errors.map((e) => ({ path: e.path, message: e.message })),
    });
    return;
  }

  if (process.env.NODE_ENV === "development") {
    console.error("ERROR 💥:", err);
  }

  res.status(statusCode).json({
    message: err.message || "An internal server error occurred.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};
