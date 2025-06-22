import mongoose from "mongoose";
import dotenv from "dotenv";

// Ensure environment variables are loaded
dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    "FATAL ERROR: MONGODB_URI environment variable is not defined."
  );
  process.exit(1); // Exit the application if the database connection string is missing
}

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Mongoose 6+ has these as default, but good to be aware of them
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
    });
    console.log("MongoDB connection established successfully.");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    // Exit process with failure
    process.exit(1);
  }
};

// The connection is initiated by just requiring/importing this file in app.ts
connectDB();
