import { Types } from "mongoose";
import { IReceipt } from "../models/Receipt";
import { IExpense } from "../models/Expense";
import { HttpError } from "../utils/HttpError";
import { categoryExistsById } from "./expense.repository";
import { findCategoryById, findCategoryByName } from "./category.repository";
import { createReceipt, findReceiptById, findReceiptByIdAndUser, findReceiptsByUser, updateReceiptById } from "./receipt.repository";
import { OcrService } from "./ocr.service";
import { parseBill } from "./huggingface/parseBill";
import { ConfirmBillInput } from "../validators/bills.validators";
import { createExpenseWithTax } from "./expense.service";
import { createJob } from "../modules/jobs/jobs.repository";
import { IJob, JobExtractedData } from "../models/Job";

interface UploadBillQueuedResult {
  success: boolean;
  message: string;
  jobId: string;
}

interface ConfirmBillResult {
  message: string;
  parsedResult: {
    merchant: string;
    amount: number | null;
    date: string | null;
    category: string;
    confidence: string;
  };
  expense: IExpense;
}

const normalizeParsedResult = (parsed: {
  merchant?: string;
  amount?: number | null;
  date?: string | null;
  category?: string;
  categoryConfidence?: string;
}): JobExtractedData["parsedResult"] => {
  return {
    merchant: parsed.merchant || "Unknown Merchant",
    amount: parsed.amount ?? null,
    date: parsed.date ?? null,
    category: parsed.category || "Other",
    confidence: parsed.categoryConfidence || "0"
  };
};

export const processUploadedBill = async (userId: string, file: Express.Multer.File): Promise<UploadBillQueuedResult> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new HttpError(401, "Invalid user id in token");
  }

  const imageUrl = file.filename ? `/uploads/${file.filename}` : file.path;

  const receipt = await createReceipt({
    userId,
    imageUrl,
    status: "UPLOADED",
    uploadedAt: new Date(),
    expenseId: null,
    extractedText: null,
    parsedData: null
  });

  const job = await createJob({
    userId,
    receiptId: String(receipt._id),
    filePath: file.path
  });

  return {
    success: true,
    message: "Bill uploaded successfully. Processing in background.",
    jobId: String(job._id)
  };
};

export const processReceiptJob = async (job: IJob): Promise<JobExtractedData> => {
  const receiptId = String(job.receiptId);
  const receipt = await findReceiptById(receiptId);
  if (!receipt) {
    throw new Error("Receipt not found for queued job");
  }

  const extractedText = await OcrService.extractText(job.filePath);
  const parsed = await parseBill(extractedText);
  const parsedResult = normalizeParsedResult(parsed);

  const updatedReceipt = await updateReceiptById(receiptId, {
    status: "PROCESSING",
    extractedText,
    parsedData: parsedResult
  });

  if (!updatedReceipt) {
    throw new Error("Failed to update receipt after OCR parsing");
  }

  return {
    receiptId,
    imageUrl: updatedReceipt.imageUrl,
    parsedResult
  };
};

export const confirmProcessedBill = async (userId: string, receiptId: string, payload: ConfirmBillInput): Promise<ConfirmBillResult> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new HttpError(401, "Invalid user id in token");
  }

  if (!Types.ObjectId.isValid(receiptId)) {
    throw new HttpError(400, "Invalid receipt id");
  }

  const receipt = await findReceiptByIdAndUser(receiptId, userId);
  if (!receipt) {
    throw new HttpError(404, "Receipt not found");
  }

  if (receipt.status !== "PROCESSING") {
    throw new HttpError(400, "Only PROCESSING receipts can be confirmed");
  }

  if (!Types.ObjectId.isValid(payload.category_id)) {
    throw new HttpError(400, "category_id must be a valid Mongo ObjectId");
  }

  const categoryExists = await categoryExistsById(payload.category_id);
  if (!categoryExists) {
    throw new HttpError(404, "Category not found for provided category_id");
  }

  const matchedCategory = await findCategoryById(payload.category_id);
  const fallbackCategory = await findCategoryByName("Other");
  const finalCategory = matchedCategory ?? fallbackCategory;

  if (!finalCategory) {
    throw new HttpError(500, "Fallback category 'Other' not found");
  }

  const confidence = receipt.parsedData?.confidence || "0";
  const parsedResult = {
    merchant: payload.merchant.trim(),
    amount: payload.amount,
    date: new Date(payload.date).toISOString(),
    category: finalCategory.name,
    confidence
  };

  const expense = await createExpenseWithTax({
    userId,
    categoryId: String(finalCategory._id),
    receiptId: String(receipt._id),
    amount: payload.amount,
    merchant: payload.merchant.trim(),
    expenseDate: new Date(payload.date),
    paymentMode: "Unknown",
    description: "Auto generated from OCR",
    createdAt: new Date()
  });

  const updatedReceipt = await updateReceiptById(String(receipt._id), {
    status: "COMPLETED",
    expenseId: String(expense._id),
    parsedData: parsedResult
  });

  if (!updatedReceipt) {
    throw new HttpError(500, "Failed to complete receipt");
  }

  return {
    message: "Expense created successfully",
    parsedResult,
    expense
  };
};

export const getUserReceipts = async (userId: string): Promise<IReceipt[]> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new HttpError(401, "Invalid user id in token");
  }

  return findReceiptsByUser(userId);
};
