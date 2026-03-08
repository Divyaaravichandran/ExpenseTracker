import "dotenv/config";
import { connectToDatabase } from "../libs/core/db";
import { env } from "../libs/core/env";
import { logger } from "../libs/core/logger";
import { processNextPendingJob } from "../modules/jobs/jobs.worker.service";

const sleep = async (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const runWorkerLoop = async (loopId: number): Promise<void> => {
  logger.info(`[worker-${loopId}] loop started`);

  while (true) {
    try {
      const processed = await processNextPendingJob();
      if (!processed) {
        await sleep(env.workerPollIntervalMs);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`[worker-${loopId}] unexpected error: ${message}`);
      await sleep(env.workerPollIntervalMs);
    }
  }
};

const start = async (): Promise<void> => {
  await connectToDatabase();
  logger.info(`[worker] started with concurrency=${env.workerConcurrency}, poll=${env.workerPollIntervalMs}ms`);

  const loops = Array.from({ length: env.workerConcurrency }, (_value, index) => runWorkerLoop(index + 1));
  await Promise.all(loops);
};

void start().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  logger.error(`[worker] fatal startup failure: ${message}`);
  process.exit(1);
});
