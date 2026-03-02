import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";
import {
  BillProcessingJob,
  Category,
  ConfirmBillPayload,
  ConfirmBillResult,
  CreateManualExpensePayload,
  Expense,
  Receipt,
  UploadBillResult
} from "../types/bill";

export const uploadBill = async (file: File): Promise<UploadBillResult> => {
  const formData = new FormData();
  formData.append("bill", file);

  const response = await api.post(ENDPOINTS.bills.upload, formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });

  return response.data as UploadBillResult;
};

export const confirmBill = async (receiptId: string, payload: ConfirmBillPayload): Promise<ConfirmBillResult> => {
  const response = await api.post(`${ENDPOINTS.bills.confirm}/${receiptId}`, payload);
  return response.data as ConfirmBillResult;
};

export const getBillJobStatus = async (jobId: string): Promise<BillProcessingJob> => {
  const response = await api.get(`${ENDPOINTS.jobs.base}/${jobId}`);
  return response.data as BillProcessingJob;
};

export interface TaxRulePreview {
  _id: string;
  financialYear: string;
  section: string;
  title: string;
  applicableCategories: string[];
  maxLimit: number;
  limitType: "yearly";
  isActive: boolean;
}

export const getTaxRulesForFinancialYear = async (financialYear: string): Promise<TaxRulePreview[]> => {
  const response = await api.get(ENDPOINTS.taxRules.base, {
    params: { financialYear }
  });
  return response.data as TaxRulePreview[];
};

export const getBills = async (): Promise<Receipt[]> => {
  const response = await api.get(ENDPOINTS.bills.list);
  return response.data as Receipt[];
};

export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get(ENDPOINTS.bills.categories);
  return response.data as Category[];
};

export const addManualExpense = async (payload: CreateManualExpensePayload): Promise<Expense> => {
  const response = await api.post(ENDPOINTS.bills.manual, payload);
  return response.data as Expense;
};

export const getExpenses = async (): Promise<Expense[]> => {
  const response = await api.get(ENDPOINTS.bills.expenses);
  return response.data as Expense[];
};

export const deleteExpense = async (expenseId: string): Promise<{ message: string }> => {
  const response = await api.delete(`${ENDPOINTS.expenses.base}/${expenseId}`);
  return response.data as { message: string };
};
