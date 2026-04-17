import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth/auth.routes";
import billsRoutes from "./routes/bills.routes";
import expensesRoutes from "./routes/expenses.routes";
import { errorHandler, notFound } from "./middleware/error.middleware";
import { ensureDefaultCategories } from "./services/category.service";
import { reportsRouter, taxRulesRouter } from "./modules/tax/tax.route";
import { ensureDefaultTaxRules } from "./modules/tax/tax.service";
import jobsRouter from "./modules/jobs/jobs.route";
import { connectToDatabase } from "./libs/core/db";
import { env } from "./libs/core/env";
import { logger } from "./libs/core/logger";

const app = express();

app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);

app.use(express.json());
app.use("/uploads", express.static("uploads"));

void connectToDatabase()
  .then(async () => {
    await ensureDefaultCategories();
    logger.info("Default categories ensured");
    await ensureDefaultTaxRules();
    logger.info("Default tax rules ensured");
  })
  .catch((err) => logger.error(`MongoDB connection error: ${String(err)}`));

app.get("/health", (_req, res) => res.json({ status: "ok" }));
app.use("/auth", authRoutes);
app.use("/api/v1/bills", billsRoutes);
app.use("/api/v1/expenses", expensesRoutes);
app.use("/api/v1/jobs", jobsRouter);
app.use("/api/v1/reports", reportsRouter);
app.use("/api/v1/tax-rules", taxRulesRouter);
// Back-compat: some deployments/proxies drop the `/api` prefix.
app.use("/v1/bills", billsRoutes);
app.use("/v1/expenses", expensesRoutes);
app.use("/v1/jobs", jobsRouter);
app.use("/v1/reports", reportsRouter);
app.use("/v1/tax-rules", taxRulesRouter);
app.use(notFound);
app.use(errorHandler);

export default app;
