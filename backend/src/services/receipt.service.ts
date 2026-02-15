import { createReceipt, findReceiptsByUser } from "./receipt.repository";
import { IReceipt } from "../models/Receipt";

export const createUploadedReceipt = async (userId: string, imageUrl: string): Promise<IReceipt> => {
  return createReceipt({
    userId,
    expenseId: null,
    imageUrl,
    status: "UPLOADED"
  });
};

export const getUserReceipts = async (userId: string): Promise<IReceipt[]> => {
  return findReceiptsByUser(userId);
};