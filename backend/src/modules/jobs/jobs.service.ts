import { Types } from "mongoose";
import { HttpError } from "../../utils/HttpError";
import { findJobByIdAndUser } from "./jobs.repository";

export interface JobStatusResponse {
  jobId: string;
  status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
  extractedData: {
    receiptId: string;
    imageUrl: string | null;
    parsedResult: {
      merchant: string;
      amount: number | null;
      date: string | null;
      category: string;
      confidence: string;
    };
  } | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getJobStatusByUser = async (userId: string, jobId: string): Promise<JobStatusResponse> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new HttpError(401, "Invalid user id in token");
  }

  if (!Types.ObjectId.isValid(jobId)) {
    throw new HttpError(400, "Invalid job id");
  }

  const job = await findJobByIdAndUser(jobId, userId);
  if (!job) {
    throw new HttpError(404, "Job not found");
  }

  return {
    jobId: String(job._id),
    status: job.status,
    extractedData: job.extractedData
      ? {
          receiptId: job.extractedData.receiptId,
          imageUrl: job.extractedData.imageUrl,
          parsedResult: {
            merchant: job.extractedData.parsedResult?.merchant ?? "",
            amount: job.extractedData.parsedResult?.amount ?? null,
            date: job.extractedData.parsedResult?.date ?? null,
            category: job.extractedData.parsedResult?.category ?? "Other",
            confidence: job.extractedData.parsedResult?.confidence ?? "0"
          }
        }
      : null,
    errorMessage: job.errorMessage ?? null,
    createdAt: job.createdAt.toISOString(),
    updatedAt: job.updatedAt.toISOString()
  };
};
