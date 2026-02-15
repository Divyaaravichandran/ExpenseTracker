import { Types } from "mongoose";
import { IExpense } from "../models/Expense";
import { HttpError } from "../utils/HttpError";
import { CreateManualExpenseInput } from "../validators/bills.validators";
import { categoryExistsById, createExpense, findExpensesByUser } from "./expense.repository";

export const createManualExpense = async (userId: string, payload: CreateManualExpenseInput): Promise<IExpense> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new HttpError(401, "Invalid user id in token");
  }

  if (!Types.ObjectId.isValid(payload.category_id)) {
    throw new HttpError(400, "category_id must be a valid Mongo ObjectId");
  }

  const categoryExists = await categoryExistsById(payload.category_id);
  if (!categoryExists) {
    throw new HttpError(404, "Category not found for provided category_id");
  }

  return createExpense({
    user_id: userId,
    category_id: payload.category_id,
    receipt_id: null,
    amount: payload.amount,
    merchant: payload.merchant,
    expense_date: new Date(payload.expense_date),
    payment_mode: payload.payment_mode,
    description: payload.description
  });
};

export const getUserExpenses = async (userId: string): Promise<IExpense[]> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new HttpError(401, "Invalid user id in token");
  }

  return findExpensesByUser(userId);
};