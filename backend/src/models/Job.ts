import mongoose, { Document, Schema, Types } from "mongoose";
import { ParsedReceiptData } from "./Receipt";

export type JobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface JobExtractedData {
  receiptId: string;
  imageUrl: string | null;
  parsedResult: ParsedReceiptData;
}

export interface IJob extends Document {
  userId: Types.ObjectId;
  receiptId: Types.ObjectId;
  filePath: string;
  status: JobStatus;
  extractedData: JobExtractedData | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const JobSchema = new Schema<IJob>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    receiptId: { type: Schema.Types.ObjectId, required: true, ref: "Receipt" },
    filePath: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "COMPLETED", "FAILED"],
      default: "PENDING",
      required: true,
      index: true
    },
    extractedData: {
      receiptId: { type: String, default: null },
      imageUrl: { type: String, default: null, trim: true },
      parsedResult: {
        merchant: { type: String, default: null, trim: true },
        amount: { type: Number, default: null },
        date: { type: String, default: null },
        category: { type: String, default: null, trim: true },
        confidence: { type: String, default: null }
      }
    },
    errorMessage: { type: String, default: null }
  },
  {
    timestamps: true
  }
);

JobSchema.index({ status: 1, createdAt: 1 });
JobSchema.index({ userId: 1, createdAt: -1 });

export const Job = mongoose.model<IJob>("Job", JobSchema);
