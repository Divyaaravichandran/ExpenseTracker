import { Expense, IExpense } from "../models/Expense";
import { Category } from "../models/Category";

interface CreateExpenseParams {
  user_id: string;
  category_id: string;
  receipt_id?: string | null;
  amount: number;
  merchant: string;
  expense_date: Date;
  payment_mode: string;
  description: string;
}

export const createExpense = async (params: CreateExpenseParams): Promise<IExpense> => {
  return Expense.create({
    user_id: params.user_id,
    category_id: params.category_id,
    receipt_id: params.receipt_id ?? null,
    amount: params.amount,
    merchant: params.merchant,
    expense_date: params.expense_date,
    payment_mode: params.payment_mode,
    description: params.description
  });
};

export const categoryExistsById = async (categoryId: string): Promise<boolean> => {
  const category = await Category.exists({ _id: categoryId });
  return Boolean(category);
};

export const findExpensesByUser = async (userId: string): Promise<IExpense[]> => {
  return Expense.find({ user_id: userId }).sort({ created_at: -1 });
};