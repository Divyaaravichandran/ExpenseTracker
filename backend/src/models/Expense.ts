import mongoose, { Document, Schema, Types } from "mongoose";

interface ExpenseTaxMeta {
  eligible: boolean;
  section?: string;
  maxLimit?: number;
  financialYear?: string;
}

export interface IExpense extends Document {
  user_id: Types.ObjectId;
  category_id: Types.ObjectId;
  receipt_id: Types.ObjectId | null;
  amount: number;
  merchant: string;
  expense_date: Date;
  payment_mode: string;
  description: string;
  tax: ExpenseTaxMeta;
  created_at: Date;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    user_id: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    category_id: { type: Schema.Types.ObjectId, required: true, ref: "Category" },
    receipt_id: { type: Schema.Types.ObjectId, ref: "Receipt", default: null },
    amount: { type: Number, required: true, min: 0 },
    merchant: { type: String, required: true, trim: true },
    expense_date: { type: Date, required: true },
    payment_mode: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    tax: {
      eligible: { type: Boolean, required: true, default: false },
      section: { type: String, trim: true },
      maxLimit: { type: Number, min: 0 },
      financialYear: { type: String, trim: true }
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false }
  }
);

ExpenseSchema.index({ "tax.section": 1, expense_date: 1 });

export const Expense = mongoose.model<IExpense>("Expense", ExpenseSchema);
