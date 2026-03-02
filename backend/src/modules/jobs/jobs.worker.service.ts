import { logger } from "../../libs/core/logger";
import { claimNextPendingJob, markJobCompleted, markJobFailed } from "./jobs.repository";
import { processReceiptJob } from "../../services/receipt.service";
import { updateReceiptById } from "../../services/receipt.repository";

export const processNextPendingJob = async (): Promise<boolean> => {
  const job = await claimNextPendingJob();
  if (!job) {
    return false;
  }

  const jobId = String(job._id);
  try {
    logger.info(`[worker] Processing job ${jobId}`);
    const extractedData = await processReceiptJob(job);
    await markJobCompleted(jobId, extractedData);
    logger.info(`[worker] Completed job ${jobId}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown worker error";
    await markJobFailed(jobId, message);

    // Keep receipt state in sync with job failure.
    await updateReceiptById(String(job.receiptId), { status: "FAILED" });
    logger.error(`[worker] Failed job ${jobId}: ${message}`);
  }

  return true;
};
