"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalErrorHandler = void 0;
const zod_1 = require("zod");
const globalErrorHandler = (err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            message: "Validation failed",
            errors: err.errors.map((e) => ({ path: e.path, message: e.message })),
        });
        return;
    }
    if (process.env.NODE_ENV === "development") {
        console.error("ERROR 💥:", err);
    }
    res.status(statusCode).json(Object.assign({ message: err.message || "An internal server error occurred." }, (process.env.NODE_ENV === "development" && { stack: err.stack })));
};
exports.globalErrorHandler = globalErrorHandler;
