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
// Trust the first proxy in front of the app. This is required for services like
// Heroku, Vercel, or other proxies to ensure express-rate-limit works correctly.
app.set("trust proxy", 1);

const PORT = process.env.PORT || 5000;

// =================================================================
// GLOBAL MIDDLEWARE
// =================================================================

// Enable Cross-Origin Resource Sharing (CORS) for your frontend
// app.use(cors({ origin: process.env.CORS_ORIGIN }));
// const whitelist = [process.env.CORS_ORIGIN, process.env.NGROK_URL].filter(
//   Boolean
// ) as string[];
// --- UPDATED CORS SETUP FOR MULTIPLE ORIGINS ---
const allowedOrigins = [
  "http://localhost:8080",
  "https://resume.fitmyjob.com",
  "https://dz876y8j9dgx0.cloudfront.net",
  "http://dz876y8j9dgx0.cloudfront.net",
];

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
// app.options("*", cors());

// Set various security HTTP headers
app.use(helmet());

// Log HTTP requests in development mode for debugging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// NOTE: The JSON parser is moved below the webhook route.

// Apply a rate limiter to all API requests to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 150, // Limit each IP to 150 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many requests from this IP, please try again after 15 minutes.",
});
app.use("/api/webhooks", authRoutes);
app.use("/api", limiter);
app.use(
  express.json({
    verify: (req, res, buf) => {
      if (buf && buf.length) {
        (req as any).rawBody = buf.toString("utf-8");
      }
    },
  })
);
// Serve static files (like uploaded profile images) from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// =================================================================
// API ROUTES
// =================================================================

// CRITICAL: The webhook route must be registered BEFORE the global express.json() parser.
// It needs the raw request body to verify the signature.

// Apply the global JSON parser for all other API routes.
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Register the rest of your API routes that expect JSON bodies.
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
