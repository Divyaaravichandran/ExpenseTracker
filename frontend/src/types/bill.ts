export type ReceiptStatus = "UPLOADED" | "PROCESSING" | "COMPLETED";

export interface ParsedReceiptData {
  merchant: string;
  amount: number | null;
  date: string | null;
  category: string;
  confidence: string;
}

export interface Receipt {
  _id: string;
  userId: string;
  expenseId: string | null;
  imageUrl: string | null;
  status: ReceiptStatus;
  extractedText?: string | null;
  parsedData?: ParsedReceiptData | null;
  uploadedAt: string;
}

export interface UploadBillResult {
  receiptId: string;
  imageUrl: string | null;
  parsedResult: ParsedReceiptData;
}

export interface ConfirmBillResult {
  message: string;
  parsedResult?: ParsedReceiptData;
  expense: Expense;
}

export interface ConfirmBillPayload {
  merchant: string;
  amount: number;
  date: string;
  category_id: string;
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
  tax: {
    eligible: boolean;
    section?: string;
    maxLimit?: number;
    financialYear?: string;
  };
  created_at: string;
  category?: {
    name: string | null;
  };
}

export interface CreateManualExpensePayload {
  merchant: string;
  amount: number;
  category_id: string;
  expense_date: string;
  payment_mode: string;
  description: string;
}
