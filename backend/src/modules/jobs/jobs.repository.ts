import { Types } from "mongoose";
import { IJob, Job, JobExtractedData } from "../../models/Job";

export const createJob = async (input: {
  userId: string;
  receiptId: string;
  filePath: string;
}): Promise<IJob> => {
  return Job.create({
    userId: new Types.ObjectId(input.userId),
    receiptId: new Types.ObjectId(input.receiptId),
    filePath: input.filePath,
    status: "PENDING",
    extractedData: null,
    errorMessage: null
  });
};

export const findJobByIdAndUser = async (jobId: string, userId: string): Promise<IJob | null> => {
  return Job.findOne({
    _id: new Types.ObjectId(jobId),
    userId: new Types.ObjectId(userId)
  });
};

export const claimNextPendingJob = async (): Promise<IJob | null> => {
  return Job.findOneAndUpdate(
    { status: "PENDING" },
    { $set: { status: "PROCESSING", errorMessage: null } },
    { sort: { createdAt: 1 }, new: true }
  );
};

export const markJobCompleted = async (jobId: string, extractedData: JobExtractedData): Promise<IJob | null> => {
  return Job.findByIdAndUpdate(
    new Types.ObjectId(jobId),
    {
      $set: {
        status: "COMPLETED",
        extractedData,
        errorMessage: null
      }
    },
    { new: true }
  );
};

export const markJobFailed = async (jobId: string, errorMessage: string): Promise<IJob | null> => {
  return Job.findByIdAndUpdate(
    new Types.ObjectId(jobId),
    {
      $set: {
        status: "FAILED",
        errorMessage: errorMessage.slice(0, 500)
      }
    },
    { new: true }
  );
};
