import { Schema, model, Document, Types } from "mongoose";
import { v4 as uuidv4 } from "uuid";

// --- INTERFACES FOR TYPE SAFETY ---

interface IAddress {
  line1: string;
  city: string;
  state: string;
  zipCode: string;
}

interface IApplicant {
  fullName: string;
  email: string;
  phone: string;
  address: IAddress;
  linkedin?: string;
  portfolio?: string;
}

interface IRecipient {
  fullName: string;
  jobTitle: string;
  companyName: string;
  address: IAddress;
}

export interface ICoverLetter extends Document {
  id: string; // Client-side UUID
  userId: Types.ObjectId;
  name: string;
  applicant: IApplicant;
  date: string;
  recipient: IRecipient;
  jobInfo: {
    position: string;
    source?: string;
  };
  salutation: string;
  body: {
    opening: string;
    paragraph1: string;
    paragraph2?: string;
    closing: string;
  };
  signoff: {
    phrase: string;
    signatureName: string;
  };
}

// --- SUB-SCHEMAS FOR NESTED OBJECTS ---

const addressSchema = new Schema<IAddress>(
  {
    line1: { type: String, default: "" },
    city: { type: String, default: "" },
    state: { type: String, default: "" },
    zipCode: { type: String, default: "" },
  },
  { _id: false }
);

const applicantSchema = new Schema<IApplicant>(
  {
    fullName: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: addressSchema, default: () => ({}) },
    linkedin: { type: String, default: "" },
    portfolio: { type: String, default: "" },
  },
  { _id: false }
);

const recipientSchema = new Schema<IRecipient>(
  {
    fullName: { type: String, default: "" },
    jobTitle: { type: String, default: "" },
    companyName: { type: String, default: "" },
    address: { type: addressSchema, default: () => ({}) },
  },
  { _id: false }
);

// --- MAIN COVER LETTER SCHEMA ---

const coverLetterSchema = new Schema<ICoverLetter>(
  {
    id: { type: String, required: true, unique: true, default: () => uuidv4() },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, default: "Untitled Cover Letter" },
    applicant: { type: applicantSchema, default: () => ({}) },
    date: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
    recipient: { type: recipientSchema, default: () => ({}) },
    jobInfo: {
      position: { type: String, default: "" },
      source: { type: String, default: "" },
    },
    salutation: { type: String, default: "Dear Hiring Manager," },
    body: {
      opening: { type: String, default: "" },
      paragraph1: { type: String, default: "" },
      paragraph2: { type: String, default: "" },
      closing: { type: String, default: "" },
    },
    signoff: {
      phrase: { type: String, default: "Sincerely," },
      signatureName: { type: String, default: "" },
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  }
);

// --- FIX: Change from 'export default' to a named export ---
export const CoverLetter = model<ICoverLetter>(
  "CoverLetter",
  coverLetterSchema
);
