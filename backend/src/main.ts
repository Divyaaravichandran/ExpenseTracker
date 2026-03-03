import "dotenv/config";
import app from "./app";
import { env } from "./libs/core/env";
import { logger } from "./libs/core/logger";
import { processNextPendingJob } from "./modules/jobs/jobs.worker.service";

const WORKER_BATCH_SIZE = 3;

const startJobWorkers = () => {
  for (let workerIndex = 0; workerIndex < env.workerConcurrency; workerIndex += 1) {
    let isRunning = false;

    const tick = async () => {
      if (isRunning) {
        return;
      }

      isRunning = true;
      try {
        let processed = false;
        let loops = 0;
        do {
          processed = await processNextPendingJob();
          loops += 1;
        } while (processed && loops < WORKER_BATCH_SIZE);
      } catch (error) {
        logger.error(
          `[worker-${workerIndex + 1}] loop failed: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      } finally {
        isRunning = false;
      }
    };

    void tick();
    setInterval(() => {
      void tick();
    }, env.workerPollIntervalMs);
  }

  logger.info(
    `Job workers started with concurrency=${env.workerConcurrency}, poll=${env.workerPollIntervalMs}ms`
  );
};

const port = env.apiPort;
app.listen(port, () => {
  logger.info(`API server running on port ${port}`);
  startJobWorkers();
});
