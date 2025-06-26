"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPlanSchema = exports.verifyPaymentSchema = exports.createSubscriptionSchema = exports.resumeValidationSchema = void 0;
const zod_1 = require("zod");
const optionalString = zod_1.z.string().optional().or(zod_1.z.literal(""));
// =================================================================
// REUSABLE SUB-SCHEMAS
// =================================================================
const experienceSchema = zod_1.z.object({
    id: zod_1.z.string(),
    company: zod_1.z.string().min(1, "Company name is required"),
    position: zod_1.z.string().min(1, "Position is required"),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    bulletPoints: zod_1.z.array(zod_1.z.string()).optional(),
});
const educationSchema = zod_1.z.object({
    id: zod_1.z.string(),
    institution: zod_1.z.string().min(1, "Institution is required"),
    degree: zod_1.z.string().min(1, "Degree is required"),
    field: zod_1.z.string().optional(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
});
const projectSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1, "Project name is required"),
    role: zod_1.z.string().optional(),
    startDate: zod_1.z.string(),
    endDate: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    bulletPoints: zod_1.z.array(zod_1.z.string()).optional(),
    url: zod_1.z.string().url().optional().or(zod_1.z.literal("")),
});
const skillSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string().min(1, "Skill name is required"),
    proficiency: zod_1.z
        .number()
        .min(0)
        .max(100, "Proficiency must be between 0 and 100"),
});
// =================================================================
// MAIN ROUTE SCHEMAS
// =================================================================
/**
 * @description Schema for creating or updating a resume.
 */
exports.resumeValidationSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Resume name is required").max(100),
    title: optionalString,
    email: optionalString, // allow empty string
    phone: optionalString,
    location: optionalString,
    website: optionalString, // allow empty
    summary: optionalString,
    themeColor: optionalString, // you can fill default in model
    templateId: zod_1.z.enum(["template-a", "template-b", "template-c", "template-d"]),
    headerAlignment: zod_1.z.enum(["left", "center", "right"]).optional(),
    profileImage: optionalString,
    declaration: optionalString,
    experiences: zod_1.z.array(experienceSchema).optional(),
    education: zod_1.z.array(educationSchema).optional(),
    projects: zod_1.z.array(projectSchema).optional(),
    skills: zod_1.z.array(skillSchema).optional(),
});
/**
 * @description Schema for initiating a subscription.
 */
exports.createSubscriptionSchema = zod_1.z.object({
    planId: zod_1.z.string().min(1, "planId is required"), // Typically a Mongoose ObjectId string
});
/**
 * @description Schema for verifying a Razorpay payment.
 */
exports.verifyPaymentSchema = zod_1.z.object({
    razorpay_order_id: zod_1.z.string().min(1, "Razorpay Order ID is required"),
    razorpay_payment_id: zod_1.z.string().min(1, "Razorpay Payment ID is required"),
    razorpay_signature: zod_1.z.string().min(1, "Razorpay Signature is required"),
});
exports.createPlanSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Plan name is required"),
    price: zod_1.z.number().positive("Price must be positive"),
    durationMonths: zod_1.z
        .number()
        .int()
        .positive("Duration must be a positive integer"),
});
