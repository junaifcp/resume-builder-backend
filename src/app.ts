import express, { Express, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import "express-async-errors"; // Handles async errors automatically

// Load environment variables from .env file
dotenv.config();

// Import utilities and middleware
import "./utils/db"; // This import triggers the database connection
import { globalErrorHandler } from "./middleware/errorMiddleware";
import { clerkAuth } from "./middleware/authMiddleware";

// Import route handlers
import resumeRoutes from "./routes/resumeRoutes";
import authRoutes from "./routes/authRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import subscriptionRoutes from "./routes/subscriptionRoutes";

// Initialize the Express application
const app: Express = express();

// === FIX FOR PROXY & RATE LIMITING ===
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;

// =================================================================
// GLOBAL MIDDLEWARE
// =================================================================

// --- UPDATED CORS SETUP FOR MULTIPLE ORIGINS ---
const allowedOrigins = [
  "http://localhost:8080",
  "https://resume.fitmyjob.com",
  "http://dz876y8j9dgx0.cloudfront.net", // Your CloudFront URL (HTTP)
  "https://dz876y8j9dgx0.cloudfront.net", // Your CloudFront URL (HTTPS)
];

if (
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "production"
) {
  console.log("[CORS] Allowed Origins:", allowedOrigins);
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      // or if the origin is in our whitelist.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`[CORS] Blocked origin: ${origin}`);
        callback(new Error("This origin is not allowed by CORS policy."));
      }
    },
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
    optionsSuccessStatus: 204,
  })
);

// Set various security HTTP headers
app.use(helmet());

// Log HTTP requests in development mode for debugging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// Apply a rate limiter to all API requests to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes.",
});

// IMPORTANT: The order of middleware matters.
// Webhook routes that need the raw body should come BEFORE the global JSON parser.
app.use("/api/webhooks", authRoutes); // Assuming this handles webhooks

// Apply rate limiter to all other /api routes
app.use("/api", limiter);

// Global JSON parser with raw body verification for webhooks
app.use(
  express.json({
    verify: (req, res, buf) => {
      if (buf && buf.length) {
        (req as any).rawBody = buf.toString("utf-8");
      }
    },
  })
);
app.use(express.urlencoded({ extended: true }));

// Serve static files (like uploaded profile images) from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// =================================================================
// API ROUTES
// =================================================================

// Register your main API routes
app.use("/api/resumes", clerkAuth, resumeRoutes);
app.use("/api/upload", clerkAuth, uploadRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// A simple health check endpoint
app.get("/api/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "UP", timestamp: new Date().toISOString() });
});

// =================================================================
// ERROR HANDLING AND SERVER STARTUP
// =================================================================

// Register the global error handler. It must be the last piece of middleware.
app.use(globalErrorHandler);

// Start the server
app.listen(PORT, () => {
  console.log(
    `🚀 Server is running on port ${PORT} in ${process.env.NODE_ENV} mode.`
  );
});

export default app;
