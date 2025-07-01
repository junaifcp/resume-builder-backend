import { z } from "zod";
const optionalString = z.string().optional().or(z.literal(""));
// =================================================================
// REUSABLE SUB-SCHEMAS
// =================================================================

const experienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "Company name is required"),
  position: z.string().min(1, "Position is required"),
  startDate: z.string(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  bulletPoints: z.array(z.string()).optional(),
});

const educationSchema = z.object({
  id: z.string(),
  institution: z.string().min(1, "Institution is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

const projectSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Project name is required"),
  role: z.string().optional(),
  startDate: z.string(),
  endDate: z.string().optional(),
  description: z.string().optional(),
  bulletPoints: z.array(z.string()).optional(),
  url: z.string().url().optional().or(z.literal("")),
});

const skillSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Skill name is required"),
  proficiency: z
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
export const resumeValidationSchema = z.object({
  name: z.string().min(1, "Resume name is required").max(100),
  title: optionalString,
  email: optionalString, // allow empty string
  phone: optionalString,
  location: optionalString,
  website: optionalString, // allow empty
  summary: optionalString,
  themeColor: optionalString, // you can fill default in model
  headerColor: optionalString, // you can fill default in model
  templateId: z.enum([
    "template-a",
    "template-b",
    "template-c",
    "template-d",
    "template-e",
    "template-f",
    "template-g",
    "template-h",
  ]),
  headerAlignment: z.enum(["left", "center", "right"]).optional(),
  profileImage: optionalString,
  declaration: optionalString,
  experiences: z.array(experienceSchema).optional(),
  education: z.array(educationSchema).optional(),
  projects: z.array(projectSchema).optional(),
  skills: z.array(skillSchema).optional(),
  languages: z.array(z.string()).optional(),
  certifications: z.array(z.string()).optional(),
  awards: z.array(z.string()).optional(),
});

/**
 * @description Schema for initiating a subscription.
 */
export const createSubscriptionSchema = z.object({
  planId: z.string().min(1, "planId is required"), // Typically a Mongoose ObjectId string
});

/**
 * @description Schema for verifying a Razorpay payment.
 */
export const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1, "Razorpay Order ID is required"),
  razorpay_payment_id: z.string().min(1, "Razorpay Payment ID is required"),
  razorpay_signature: z.string().min(1, "Razorpay Signature is required"),
});

export const createPlanSchema = z.object({
  name: z.string().min(1, "Plan name is required"),
  price: z.number().positive("Price must be positive"),
  durationMonths: z
    .number()
    .int()
    .positive("Duration must be a positive integer"),
});
