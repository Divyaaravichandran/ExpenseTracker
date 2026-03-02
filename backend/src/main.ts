import "dotenv/config";
import app from "./app";
import { env } from "./libs/core/env";
import { logger } from "./libs/core/logger";

const port = env.apiPort;
app.listen(port, () => {
  logger.info(`API server running on port ${port}`);
});
