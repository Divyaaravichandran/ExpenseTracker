export type ReceiptStatus = "UPLOADED" | "PROCESSING" | "COMPLETED";

export interface Receipt {
  _id: string;
  userId: string;
  expenseId: string | null;
  imageUrl: string | null;
  status: ReceiptStatus;
  uploadedAt: string;
}

export interface Category {
  _id: string;
  name: string;
  keywords: string;
}

export interface Expense {
  _id: string;
  user_id: string;
  category_id: string;
  receipt_id: string | null;
  amount: number;
  merchant: string;
  expense_date: string;
  payment_mode: string;
  description: string;
  created_at: string;
}

export interface CreateManualExpensePayload {
  merchant: string;
  amount: number;
  category_id: string;
  expense_date: string;
  payment_mode: string;
  description: string;
}