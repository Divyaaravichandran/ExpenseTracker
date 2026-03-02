import { Router } from "express";
import { authenticate } from "../../middleware/auth.middleware";
import { getJobStatusController } from "./jobs.controller";

const jobsRouter = Router();

jobsRouter.use(authenticate);
jobsRouter.get("/:jobId", getJobStatusController);

export default jobsRouter;
