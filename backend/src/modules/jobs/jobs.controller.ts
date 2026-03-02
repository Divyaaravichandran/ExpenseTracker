import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { HttpError } from "../../utils/HttpError";
import { getJobStatusByUser } from "./jobs.service";

const getUserId = (req: Request): string => {
  if (!req.user?.id) {
    throw new HttpError(401, "Unauthorized");
  }
  return req.user.id;
};

export const getJobStatusController = asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const result = await getJobStatusByUser(getUserId(req), jobId);
  res.status(200).json(result);
});
