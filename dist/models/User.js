"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const userSchema = new mongoose_1.Schema({
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
            type: mongoose_1.Schema.Types.ObjectId,
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
}, {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
});
exports.default = (0, mongoose_1.model)("User", userSchema);
