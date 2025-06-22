// middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { Clerk } from "@clerk/clerk-sdk-node";
import User from "../models/User";

const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY! });

export const clerkAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  console.log(`[Auth] Checking ${req.method} ${req.originalUrl}`);

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    console.warn("[Auth] Missing or malformed Authorization header");
    res.status(401).json({
      message: "Authorization header is missing or improperly formatted.",
    });
    return;
  }

  const token = authHeader.split(" ")[1];
  console.log(`[Auth] Token (first 15 chars): ${token.substring(0, 15)}...`);

  try {
    // Verify the token with Clerk
    const verification = await clerkClient.verifyToken(token);
    console.log("[Auth] Raw verification payload:", verification);

    // Extract the Clerk user ID directly from `sub`
    const userId = verification.sub as string | undefined;
    if (!userId) {
      console.error("[Auth] sub claim missing in verification payload");
      res.status(401).json({
        message: "Invalid authentication token. User ID not found in token.",
      });
      return;
    }
    console.log(`[Auth] Clerk user ID: ${userId}`);

    // Lookup the user in your local database
    const user = await User.findOne({ clerkUserId: userId });
    if (!user) {
      console.error(`[Auth] No local user found for Clerk ID ${userId}`);
      res.status(404).json({
        message: "Authenticated user not found in the database.",
      });
      return;
    }
    console.log(`[Auth] Local user found: ${user.email}`);

    // Attach the user object to the request and continue
    (req as any).user = user;
    next();
  } catch (err: any) {
    console.error("[Auth] Verification error:", err);
    res.status(401).json({
      message:
        "Authentication failed. The provided token is invalid or expired.",
    });
  }
};

// import { Request, Response, NextFunction } from "express";
// import { Clerk } from "@clerk/clerk-sdk-node";
// import User from "../models/User";

// const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

// export const clerkAuth = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   console.log(`[Auth] Checking request to: ${req.method} ${req.originalUrl}`);
//   try {
//     const authHeader = req.headers.authorization;
//     console.log(`[Auth] Authorization Header:`, authHeader);

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       res.status(401).json({
//         message: "Authorization header is missing or improperly formatted.",
//       });
//       return;
//     }

//     const token = authHeader.split(" ")[1];
//     console.log(
//       `[Auth] Extracted Token:`,
//       token ? `${token.substring(0, 15)}...` : "None"
//     );

//     // Verify the token with Clerk
//     const { userId } = await clerkClient.verifyToken(token);
//     console.log(
//       `[Auth] Token verified successfully for Clerk User ID:`,
//       userId
//     );

//     if (!userId) {
//       // This case is unlikely if verifyToken succeeds, but good for safety
//       res.status(401).json({
//         message: "Invalid authentication token. Clerk user ID not found.",
//       });
//       return;
//     }

//     // Find the user in your local database
//     console.log(`[Auth] Finding user in database with Clerk ID: ${userId}`);
//     const user = await User.findOne({ clerkUserId: userId });

//     if (!user) {
//       console.error(
//         `[Auth] Critical Error: User with Clerk ID ${userId} found in Clerk but NOT in the database.`
//       );
//       res
//         .status(404)
//         .json({
//           message:
//             "Authenticated user not found in the database. Sync issue may have occurred.",
//         });
//       return;
//     }

//     console.log(`[Auth] User found in database:`, user.email);
//     (req as any).user = user;

//     next();
//   } catch (error: any) {
//     // This block will catch errors from clerkClient.verifyToken if the token is invalid
//     console.error("[Auth] Authentication Error:", error.message || error);
//     res.status(401).json({
//       message:
//         "Authentication failed. The provided token is invalid or expired.",
//     });
//     return;
//   }
// };

// import { Request, Response, NextFunction } from "express";
// import { Clerk } from "@clerk/clerk-sdk-node";
// import User from "../models/User";

// const clerkClient = Clerk({ secretKey: process.env.CLERK_SECRET_KEY });

// export const clerkAuth = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ): Promise<void> => {
//   try {
//     const authHeader = req.headers.authorization;

//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       res.status(401).json({
//         message: "Authorization header is missing or improperly formatted.",
//       });
//       return;
//     }

//     const token = authHeader.split(" ")[1];

//     const { userId } = await clerkClient.verifyToken(token);

//     if (!userId) {
//       res.status(401).json({
//         message: "Invalid authentication token. Clerk user ID not found.",
//       });
//       return;
//     }

//     const user = await User.findOne({ clerkUserId: userId });

//     if (!user) {
//       res
//         .status(404)
//         .json({ message: "Authenticated user not found in the database." });
//       return;
//     }

//     (req as any).user = user;

//     next();
//   } catch (error) {
//     console.error("Authentication error:", error);
//     res.status(401).json({
//       message:
//         "Authentication failed. The provided token is invalid or expired.",
//     });
//     return;
//   }
// };
