import { Types } from "mongoose";
import fs from "fs/promises";
import path from "path";
import { IExpense } from "../models/Expense";
import { HttpError } from "../utils/HttpError";
import { CreateManualExpenseInput } from "../validators/bills.validators";
import { categoryExistsById, createExpense, deleteExpenseByIdAndUser, findExpenseByIdAndUser, findExpensesByUser } from "./expense.repository";
import { deleteReceiptByIdAndUser, findReceiptByIdAndUser } from "./receipt.repository";

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

export const getUserExpenses = async (userId: string): Promise<Record<string, unknown>[]> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new HttpError(401, "Invalid user id in token");
  }

  return findExpensesByUser(userId);
};

export const deleteUserExpenseWithReceipt = async (userId: string, expenseId: string): Promise<void> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new HttpError(401, "Invalid user id in token");
  }

  if (!Types.ObjectId.isValid(expenseId)) {
    throw new HttpError(400, "Invalid expense id");
  }

  const expense = await findExpenseByIdAndUser(expenseId, userId);
  if (!expense) {
    throw new HttpError(404, "Expense not found");
  }

  const receiptId = expense.receipt_id ? String(expense.receipt_id) : null;
  if (receiptId && Types.ObjectId.isValid(receiptId)) {
    const receipt = await findReceiptByIdAndUser(receiptId, userId);
    if (receipt) {
      await deleteReceiptByIdAndUser(receiptId, userId);

      if (receipt.imageUrl?.startsWith("/uploads/")) {
        const relativeFile = receipt.imageUrl.replace(/^\/uploads\//, "");
        const absoluteFilePath = path.join(process.cwd(), "uploads", relativeFile);

        try {
          await fs.unlink(absoluteFilePath);
        } catch {
          // Ignore cleanup errors to keep delete flow reliable.
        }
      }
    }
  }

  const deleted = await deleteExpenseByIdAndUser(expenseId, userId);
  if (!deleted) {
    throw new HttpError(404, "Expense not found");
  }
};
