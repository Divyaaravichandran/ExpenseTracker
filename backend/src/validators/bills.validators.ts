import { z } from "zod";

export const createManualExpenseSchema = z.object({
  merchant: z.string().trim().min(1, "merchant is required"),
  amount: z.number().positive("amount must be greater than 0"),
  category_id: z.string().trim().min(1, "category_id is required"),
  expense_date: z.string().datetime("expense_date must be a valid ISO datetime string"),
  payment_mode: z.string().trim().min(1, "payment_mode is required"),
  description: z.string().trim().min(1, "description is required")
});

const dateStringSchema = z.string().trim().refine((value) => {
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}, "date must be a valid date string");

export const confirmBillSchema = z.object({
  merchant: z.string().trim().min(1, "merchant is required"),
  amount: z.number().positive("amount must be greater than 0"),
  date: dateStringSchema,
  category_id: z.string().trim().min(1, "category_id is required")
});

export type CreateManualExpenseInput = z.infer<typeof createManualExpenseSchema>;
export type ConfirmBillInput = z.infer<typeof confirmBillSchema>;
