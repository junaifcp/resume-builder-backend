import { Schema, model, Document, Types } from "mongoose";

/**
 * @interface IUser
 * Represents a user document in the database.
 * Includes Clerk authentication ID and subscription status linked to a Plan.
 */
export interface IUser extends Document {
  clerkUserId: string;
  email: string;
  _id: Types.ObjectId;
  phone: { type: String; default: "" };
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  subscription: {
    planId?: Types.ObjectId; // Reference to the 'Plan' model
    subscriptionId?: string; // The ID from Cashfree for this user's subscription // <-- Corrected comment
    status:
      | "inactive"
      | "active"
      | "on_hold"
      | "cancelled"
      | "completed"
      | "initialized"; // <--- UPDATED LINE
    endDate?: Date; // The date when the current active subscription expires
  };
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    clerkUserId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
    },
    firstName: { type: String },
    lastName: { type: String },
    profileImageUrl: { type: String },
    subscription: {
      planId: {
        type: Schema.Types.ObjectId,
        ref: "Plan",
      },
      subscriptionId: { type: String },
      status: {
        type: String,
        enum: [
          "inactive",
          "active",
          "on_hold",
          "cancelled",
          "completed",
          "initialized",
        ],
        default: "inactive",
      },
      endDate: { type: Date },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

export default model<IUser>("User", userSchema);
