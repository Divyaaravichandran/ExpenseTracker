import { Types } from "mongoose";
import { IReceipt, ParsedReceiptData, Receipt, ReceiptStatus } from "../models/Receipt";

interface CreateReceiptParams {
  userId: string;
  expenseId?: string | null;
  imageUrl: string | null;
  status: ReceiptStatus;
  extractedText?: string | null;
  parsedData?: ParsedReceiptData | null;
  uploadedAt?: Date;
}

interface UpdateReceiptParams {
  status?: ReceiptStatus;
  expenseId?: string | null;
  extractedText?: string | null;
  parsedData?: ParsedReceiptData | null;
}

export const createReceipt = async (params: CreateReceiptParams): Promise<IReceipt> => {
  const receipt = await Receipt.create({
    userId: new Types.ObjectId(params.userId),
    expenseId: params.expenseId ? new Types.ObjectId(params.expenseId) : null,
    imageUrl: params.imageUrl,
    status: params.status,
    extractedText: params.extractedText ?? null,
    parsedData: params.parsedData ?? null,
    uploadedAt: params.uploadedAt
  });

  return receipt;
};

export const updateReceiptById = async (receiptId: string, params: UpdateReceiptParams): Promise<IReceipt | null> => {
  return Receipt.findByIdAndUpdate(
    new Types.ObjectId(receiptId),
    {
      ...(params.status ? { status: params.status } : {}),
      ...(params.expenseId !== undefined
        ? { expenseId: params.expenseId ? new Types.ObjectId(params.expenseId) : null }
        : {}),
      ...(params.extractedText !== undefined ? { extractedText: params.extractedText } : {}),
      ...(params.parsedData !== undefined ? { parsedData: params.parsedData } : {})
    },
    { new: true }
  );
};

export const findReceiptsByUser = async (userId: string): Promise<IReceipt[]> => {
  return Receipt.find({ userId: new Types.ObjectId(userId) }).sort({ uploadedAt: -1 });
};

export const findReceiptByIdAndUser = async (receiptId: string, userId: string): Promise<IReceipt | null> => {
  return Receipt.findOne({
    _id: new Types.ObjectId(receiptId),
    userId: new Types.ObjectId(userId)
  });
};

export const findReceiptById = async (receiptId: string): Promise<IReceipt | null> => {
  return Receipt.findById(new Types.ObjectId(receiptId));
};

export const deleteReceiptByIdAndUser = async (receiptId: string, userId: string): Promise<boolean> => {
  const result = await Receipt.deleteOne({
    _id: new Types.ObjectId(receiptId),
    userId: new Types.ObjectId(userId)
  });

  return result.deletedCount === 1;
};
