import mongoose, { Document, Schema, Types } from "mongoose";

export type ReceiptStatus = "UPLOADED" | "PROCESSING" | "COMPLETED" | "FAILED";

export interface ParsedReceiptData {
  merchant: string;
  amount: number | null;
  date: string | null;
  category: string;
  confidence: string;
}

export interface IReceipt extends Document {
  userId: Types.ObjectId;
  expenseId: Types.ObjectId | null;
  imageUrl: string | null;
  status: ReceiptStatus;
  extractedText: string | null;
  parsedData: ParsedReceiptData | null;
  uploadedAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    expenseId: { type: Schema.Types.ObjectId, ref: "Expense", default: null },
    imageUrl: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ["UPLOADED", "PROCESSING", "COMPLETED", "FAILED"],
      default: "UPLOADED",
      required: true
    },
    extractedText: { type: String, default: null },
    parsedData: {
      merchant: { type: String, default: null, trim: true },
      amount: { type: Number, default: null },
      date: { type: String, default: null },
      category: { type: String, default: null, trim: true },
      confidence: { type: String, default: null }
    }
  },
  {
    timestamps: { createdAt: "uploadedAt", updatedAt: false }
  }
);

export const Receipt = mongoose.model<IReceipt>("Receipt", ReceiptSchema);
