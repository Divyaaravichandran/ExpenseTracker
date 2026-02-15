import { Types } from "mongoose";
import { IReceipt, Receipt, ReceiptStatus } from "../models/Receipt";

interface CreateReceiptParams {
  userId: string;
  expenseId?: string | null;
  imageUrl: string | null;
  status: ReceiptStatus;
}

export const createReceipt = async (params: CreateReceiptParams): Promise<IReceipt> => {
  const receipt = await Receipt.create({
    userId: new Types.ObjectId(params.userId),
    expenseId: params.expenseId ? new Types.ObjectId(params.expenseId) : null,
    imageUrl: params.imageUrl,
    status: params.status
  });

  return receipt;
};

export const findReceiptsByUser = async (userId: string): Promise<IReceipt[]> => {
  return Receipt.find({ userId: new Types.ObjectId(userId) }).sort({ uploadedAt: -1 });
};