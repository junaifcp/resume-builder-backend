"use strict";
// ---- FILE: src/services/user.service.ts ----
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userService = void 0;
const User_1 = __importDefault(require("../models/User"));
const Resume_1 = __importDefault(require("../models/Resume"));
/**
 * @description Handles the logic for creating or updating a user in the database.
 * This is called from the authController when a user is created or updated in Clerk.
 * @param clerkUserId - The unique identifier from Clerk.
 * @param attributes - The user data payload from the webhook.
 * @returns The created or updated user document.
 */
const upsertUser = (clerkUserId, attributes) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userData = {
        email: (_a = attributes.email_addresses[0]) === null || _a === void 0 ? void 0 : _a.email_address,
        firstName: attributes.first_name,
        lastName: attributes.last_name,
        profileImageUrl: attributes.image_url,
    };
    // Find a user by their Clerk ID and update them, or create them if they don't exist.
    const user = yield User_1.default.findOneAndUpdate({ clerkUserId: clerkUserId }, { $set: userData }, { new: true, upsert: true } // `new: true` returns the updated doc, `upsert: true` creates it if not found
    );
    return user;
});
/**
 * @description Handles the logic for deleting a user and their associated data from the database.
 * Called from a webhook when a user is deleted in Clerk.
 * @param clerkUserId - The unique identifier from Clerk.
 * @returns The deleted user document or null if not found.
 */
const deleteUser = (clerkUserId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield User_1.default.findOneAndDelete({ clerkUserId: clerkUserId });
    // If a user is deleted, also delete all their resumes to clean up data.
    if (user) {
        yield Resume_1.default.deleteMany({ userId: user._id });
    }
    return user;
});
exports.userService = {
    upsertUser,
    deleteUser,
};
