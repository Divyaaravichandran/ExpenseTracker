const toNumber = (raw: string | undefined, fallback: number): number => {
  if (!raw) {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  apiPort: toNumber(process.env.PORT, 4000),
  mongoUri: process.env.MONGO_URI?.trim() || "",
  corsOrigin: process.env.CORS_ORIGIN?.trim()
    ? process.env.CORS_ORIGIN.split(",").map((item) => item.trim())
    : "*",
  workerPollIntervalMs: toNumber(process.env.WORKER_POLL_INTERVAL_MS, 500),
  workerConcurrency: Math.max(1, toNumber(process.env.WORKER_CONCURRENCY, 2))
};

export const assertMongoUri = (): string => {
  if (!env.mongoUri) {
    throw new Error("MONGO_URI is not set");
  }
  return env.mongoUri;
};
