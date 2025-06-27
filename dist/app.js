"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
require("express-async-errors");
const contactRoutes_1 = __importDefault(require("./routes/contactRoutes"));
// Load environment variables from .env file
dotenv_1.default.config();
// Import utilities and middleware
require("./utils/db"); // This import triggers the database connection
const errorMiddleware_1 = require("./middleware/errorMiddleware");
const authMiddleware_1 = require("./middleware/authMiddleware");
// Import route handlers
const resumeRoutes_1 = __importDefault(require("./routes/resumeRoutes"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const uploadRoutes_1 = __importDefault(require("./routes/uploadRoutes"));
const subscriptionRoutes_1 = __importDefault(require("./routes/subscriptionRoutes"));
// Initialize the Express application
const app = (0, express_1.default)();
// === FIX FOR PROXY & RATE LIMITING ===
app.set("trust proxy", 1);
const PORT = process.env.PORT || 5001;
// =================================================================
// GLOBAL MIDDLEWARE
// =================================================================
// --- UPDATED CORS SETUP FOR MULTIPLE ORIGINS ---
const allowedOrigins = [
    "http://localhost:8080",
    "https://resume.fitmyjob.com",
    "http://dz876y8j9dgx0.cloudfront.net", // Your CloudFront URL (HTTP)
    "https://dz876y8j9dgx0.cloudfront.net", // Your CloudFront URL (HTTPS)
    "https://resume.fitmyskill.com",
    "http://resume.fitmyskill.com",
];
if (process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "production") {
    console.log("[CORS] Allowed Origins:", allowedOrigins);
}
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        // or if the origin is in our whitelist.
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            console.warn(`[CORS] Blocked origin: ${origin}`);
            callback(new Error("This origin is not allowed by CORS policy."));
        }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204,
}));
// Set various security HTTP headers
app.use((0, helmet_1.default)());
// Log HTTP requests in development mode for debugging
if (process.env.NODE_ENV === "development") {
    app.use((0, morgan_1.default)("dev"));
}
// Apply a rate limiter to all API requests to prevent abuse
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 150, // Limit each IP to 150 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests from this IP, please try again after 15 minutes.",
});
// IMPORTANT: The order of middleware matters.
// Webhook routes that need the raw body should come BEFORE the global JSON parser.
app.use("/api/webhooks", authRoutes_1.default); // Assuming this handles webhooks
// Apply rate limiter to all other /api routes
app.use("/api", limiter);
// Global JSON parser with raw body verification for webhooks
app.use(express_1.default.json({
    verify: (req, res, buf) => {
        if (buf && buf.length) {
            req.rawBody = buf.toString("utf-8");
        }
    },
}));
app.use(express_1.default.urlencoded({ extended: true }));
// Serve static files (like uploaded profile images) from the 'uploads' directory
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// =================================================================
// API ROUTES
// =================================================================
// Register your main API routes
app.use("/api/resumes", authMiddleware_1.clerkAuth, resumeRoutes_1.default);
app.use("/api/upload", authMiddleware_1.clerkAuth, uploadRoutes_1.default);
app.use("/api/subscriptions", subscriptionRoutes_1.default);
app.use("/api/contact", contactRoutes_1.default);
// A simple health check endpoint
app.get("/api/health", (req, res) => {
    res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});
// =================================================================
// ERROR HANDLING AND SERVER STARTUP
// =================================================================
// Register the global error handler. It must be the last piece of middleware.
app.use(errorMiddleware_1.globalErrorHandler);
// Start the server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`);
});
exports.default = app;
