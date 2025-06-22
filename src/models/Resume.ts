import { Schema, model, Document, Types } from "mongoose";

/**
 * @interface IResume
 * Represents a complete resume document in the database.
 * It is linked to a user and contains all sections of the resume.
 */
export interface IResume extends Document {
  id: string; // UUID for frontend identification
  userId: Types.ObjectId; // Reference to the 'User' model
  name: string;
  title: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  summary: string;
  themeColor: string;
  templateId: "template-a" | "template-b" | "template-c" | "template-d";
  headerAlignment: "left" | "center" | "right";
  profileImage?: string;
  declaration?: string;
  experiences: {
    id: string;
    company: string;
    position: string;
    startDate: string;
    endDate: string;
    description: string;
    bulletPoints: string[];
  }[];
  education: {
    id: string;
    institution: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  projects: {
    id: string;
    name: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
    bulletPoints: string[];
    url?: string;
  }[];
  skills: {
    id: string;
    name: string;
    proficiency: number;
  }[];
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
}

const resumeSchema = new Schema<IResume>(
  {
    id: { type: String, required: true, unique: true },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: { type: String, required: true, default: "Untitled Resume" },
    title: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
    summary: { type: String, default: "" },
    themeColor: { type: String, default: "#0EA5E9" },
    templateId: {
      type: String,
      enum: ["template-a", "template-b", "template-c", "template-d"],
      default: "template-a",
    },
    headerAlignment: {
      type: String,
      enum: ["left", "center", "right"],
      default: "left",
    },
    profileImage: { type: String, default: "" },
    declaration: { type: String, default: "" },
    experiences: {
      type: [
        {
          id: String,
          company: String,
          position: String,
          startDate: String,
          endDate: String,
          description: String,
          bulletPoints: [String],
        },
      ],
      default: [],
    },
    education: {
      type: [
        {
          id: String,
          institution: String,
          degree: String,
          field: String,
          startDate: String,
          endDate: String,
          description: String,
        },
      ],
      default: [],
    },
    projects: {
      type: [
        {
          id: String,
          name: String,
          role: String,
          startDate: String,
          endDate: String,
          description: String,
          bulletPoints: [String],
          url: String,
        },
      ],
      default: [],
    },
    skills: {
      type: [
        {
          id: String,
          name: String,
          proficiency: { type: Number, min: 0, max: 100 },
        },
      ],
      default: [],
    },
    lastUpdated: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);
resumeSchema.index({ userId: 1, name: 1 });

export default model<IResume>("Resume", resumeSchema);

// import { Schema, model, Document, Types } from "mongoose";

// /**
//  * @interface IResume
//  * Represents a complete resume document in the database.
//  * It is linked to a user and contains all sections of the resume.
//  */
// export interface IResume extends Document {
//   id: string; // UUID for frontend identification
//   userId: Types.ObjectId; // Reference to the 'User' model
//   name: string;
//   title: string;
//   email: string;
//   phone: string;
//   location: string;
//   website: string;
//   summary: string;
//   themeColor: string;
//   templateId: "template-a" | "template-b" | "template-c" | "template-d";
//   headerAlignment: "left" | "center" | "right";
//   profileImage?: string;
//   declaration?: string;
//   experiences: {
//     id: string;
//     company: string;
//     position: string;
//     startDate: string;
//     endDate: string;
//     description: string;
//     bulletPoints: string[];
//   }[];
//   education: {
//     id: string;
//     institution: string;
//     degree: string;
//     field: string;
//     startDate: string;
//     endDate: string;
//     description: string;
//   }[];
//   projects: {
//     id: string;
//     name: string;
//     role: string;
//     startDate: string;
//     endDate: string;
//     description: string;
//     bulletPoints: string[];
//     url?: string;
//   }[];
//   skills: {
//     id: string;
//     name: string;
//     proficiency: number;
//   }[];
//   lastUpdated: Date;
//   createdAt: Date;
//   updatedAt: Date;
// }

// const resumeSchema = new Schema<IResume>(
//   {
//     id: { type: String, required: true, unique: true },
//     userId: {
//       type: Schema.Types.ObjectId,
//       ref: "User",
//       required: true,
//       index: true,
//     },
//     name: { type: String, required: true, minlength: 1, maxlength: 100 },
//     title: String,
//     email: { type: String, required: true },
//     phone: String,
//     location: String,
//     website: String,
//     summary: String,
//     themeColor: { type: String, default: "#0EA5E9" },
//     templateId: {
//       type: String,
//       enum: ["template-a", "template-b", "template-c", "template-d"],
//       default: "template-a",
//     },
//     headerAlignment: {
//       type: String,
//       enum: ["left", "center", "right"],
//       default: "left",
//     },
//     profileImage: String,
//     declaration: String,
//     experiences: [
//       {
//         id: String,
//         company: String,
//         position: String,
//         startDate: String,
//         endDate: String,
//         description: String,
//         bulletPoints: [String],
//       },
//     ],
//     education: [
//       {
//         id: String,
//         institution: String,
//         degree: String,
//         field: String,
//         startDate: String,
//         endDate: String,
//         description: String,
//       },
//     ],
//     projects: [
//       {
//         id: String,
//         name: String,
//         role: String,
//         startDate: String,
//         endDate: String,
//         description: String,
//         bulletPoints: [String],
//         url: String,
//       },
//     ],
//     skills: [
//       {
//         id: String,
//         name: String,
//         proficiency: { type: Number, min: 0, max: 100 },
//       },
//     ],
//     lastUpdated: { type: Date, default: Date.now },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Compound index for searching resumes by name for a specific user
// resumeSchema.index({ userId: 1, name: 1 });

// export default model<IResume>("Resume", resumeSchema);
