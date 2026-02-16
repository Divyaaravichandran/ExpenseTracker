import { Types } from "mongoose";
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
  created_at?: Date;
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
    description: params.description,
    created_at: params.created_at
  });
};

export const categoryExistsById = async (categoryId: string): Promise<boolean> => {
  const category = await Category.exists({ _id: categoryId });
  return Boolean(category);
};

export const findExpensesByUser = async (userId: string): Promise<Record<string, unknown>[]> => {
  return Expense.aggregate([
    {
      $match: {
        user_id: new Types.ObjectId(userId)
      }
    },
    {
      $sort: {
        created_at: -1
      }
    },
    {
      $lookup: {
        from: "categories",
        localField: "category_id",
        foreignField: "_id",
        as: "categoryDoc"
      }
    },
    {
      $lookup: {
        from: "receipts",
        localField: "receipt_id",
        foreignField: "_id",
        as: "receiptDoc"
      }
    },
    {
      $addFields: {
        category: {
          name: {
            $ifNull: [{ $arrayElemAt: ["$categoryDoc.name", 0] }, null]
          }
        },
        receipt: {
          imageUrl: {
            $ifNull: [{ $arrayElemAt: ["$receiptDoc.imageUrl", 0] }, null]
          }
        }
      }
    },
    {
      $project: {
        categoryDoc: 0,
        receiptDoc: 0
      }
    }
  ]);
};

export const findExpenseByIdAndUser = async (expenseId: string, userId: string): Promise<IExpense | null> => {
  return Expense.findOne({
    _id: new Types.ObjectId(expenseId),
    user_id: new Types.ObjectId(userId)
  });
};

export const deleteExpenseByIdAndUser = async (expenseId: string, userId: string): Promise<boolean> => {
  const result = await Expense.deleteOne({
    _id: new Types.ObjectId(expenseId),
    user_id: new Types.ObjectId(userId)
  });

  return result.deletedCount === 1;
};
