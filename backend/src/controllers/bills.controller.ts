import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/HttpError";
import { saveUploadedFile } from "../services/storage.service";
import { createUploadedReceipt, getUserReceipts } from "../services/receipt.service";
import { createManualExpense, getUserExpenses } from "../services/expense.service";
import { getCategories } from "../services/category.service";

const getUserId = (req: Request): string => {
  if (!req.user?.id) {
    throw new HttpError(401, "Unauthorized");
  }

  return req.user.id;
};

export const uploadBill = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    throw new HttpError(400, "Bill image file is required");
  }

  const imageUrl = await saveUploadedFile(req.file);
  const receipt = await createUploadedReceipt(getUserId(req), imageUrl);

  res.status(201).json(receipt);
});

export const listBills = asyncHandler(async (req: Request, res: Response) => {
  const receipts = await getUserReceipts(getUserId(req));
  res.status(200).json(receipts);
});

export const addManualExpense = asyncHandler(async (req: Request, res: Response) => {
  const expense = await createManualExpense(getUserId(req), req.body);
  res.status(201).json(expense);
});

export const listExpenses = asyncHandler(async (req: Request, res: Response) => {
  const expenses = await getUserExpenses(getUserId(req));
  res.status(200).json(expenses);
});

export const listCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await getCategories();
  res.status(200).json(categories);
});