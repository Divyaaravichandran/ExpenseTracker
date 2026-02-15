import mongoose, { Document, Schema, Types } from "mongoose";

export type ReceiptStatus = "UPLOADED" | "PROCESSING" | "COMPLETED";

export interface IReceipt extends Document {
  userId: Types.ObjectId;
  expenseId: Types.ObjectId | null;
  imageUrl: string | null;
  status: ReceiptStatus;
  uploadedAt: Date;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    expenseId: { type: Schema.Types.ObjectId, ref: "Expense", default: null },
    imageUrl: { type: String, default: null, trim: true },
    status: {
      type: String,
      enum: ["UPLOADED", "PROCESSING", "COMPLETED"],
      default: "UPLOADED",
      required: true
    }
  },
  {
    timestamps: { createdAt: "uploadedAt", updatedAt: false }
  }
);

export const Receipt = mongoose.model<IReceipt>("Receipt", ReceiptSchema);