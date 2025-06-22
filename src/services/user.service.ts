// ---- FILE: src/services/user.service.ts ----

import User, { IUser } from "../models/User";
import Resume from "../models/Resume";

/**
 * @description Handles the logic for creating or updating a user in the database.
 * This is called from the authController when a user is created or updated in Clerk.
 * @param clerkUserId - The unique identifier from Clerk.
 * @param attributes - The user data payload from the webhook.
 * @returns The created or updated user document.
 */
const upsertUser = async (
  clerkUserId: string,
  attributes: Record<string, any>
): Promise<IUser> => {
  const userData = {
    email: attributes.email_addresses[0]?.email_address,
    firstName: attributes.first_name,
    lastName: attributes.last_name,
    profileImageUrl: attributes.image_url,
  };

  // Find a user by their Clerk ID and update them, or create them if they don't exist.
  const user = await User.findOneAndUpdate(
    { clerkUserId: clerkUserId },
    { $set: userData },
    { new: true, upsert: true } // `new: true` returns the updated doc, `upsert: true` creates it if not found
  );

  return user;
};

/**
 * @description Handles the logic for deleting a user and their associated data from the database.
 * Called from a webhook when a user is deleted in Clerk.
 * @param clerkUserId - The unique identifier from Clerk.
 * @returns The deleted user document or null if not found.
 */
const deleteUser = async (clerkUserId: string): Promise<IUser | null> => {
  const user = await User.findOneAndDelete({ clerkUserId: clerkUserId });

  // If a user is deleted, also delete all their resumes to clean up data.
  if (user) {
    await Resume.deleteMany({ userId: user._id });
  }

  return user;
};

export const userService = {
  upsertUser,
  deleteUser,
};
