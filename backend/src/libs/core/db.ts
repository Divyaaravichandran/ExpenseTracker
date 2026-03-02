import mongoose from "mongoose";
import { assertMongoUri } from "./env";
import { logger } from "./logger";

export const connectToDatabase = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUri = assertMongoUri();
  await mongoose.connect(mongoUri);
  logger.info("MongoDB connected");
};
