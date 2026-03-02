import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { HttpError } from "../utils/HttpError";
import { confirmProcessedBill, getUserReceipts, processUploadedBill } from "../services/receipt.service";

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

  const result = await processUploadedBill(getUserId(req), req.file);
  res.status(202).json(result);
});

export const confirmBill = asyncHandler(async (req: Request, res: Response) => {
  const { receiptId } = req.params;
  const result = await confirmProcessedBill(getUserId(req), receiptId, req.body);
  res.status(200).json(result);
});

export const listBills = asyncHandler(async (req: Request, res: Response) => {
  const receipts = await getUserReceipts(getUserId(req));
  res.status(200).json(receipts);
});
