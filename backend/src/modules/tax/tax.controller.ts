import { Request, Response } from "express";
import { z } from "zod";
import { HttpError } from "../../utils/HttpError";
import { asyncHandler } from "../../utils/asyncHandler";
import { getFinancialYear } from "../../libs/core/utils/financial-year";
import {
  createTaxRuleService,
  deleteTaxRuleService,
  getTaxSummary,
  getTaxSectionExpenses,
  getTaxUtilizationTimeline,
  listTaxRulesService,
  overrideExpenseTaxService,
  patchTaxRuleService
} from "./tax.service";

const getUserId = (req: Request): string => {
  if (!req.user?.id) {
    throw new HttpError(401, "Unauthorized");
  }

  return req.user.id;
};

const taxSummaryQuerySchema = z.object({
  financialYear: z.string().regex(/^\d{4}-\d{4}$/, "financialYear must be in YYYY-YYYY format").optional(),
  year: z.string().regex(/^\d{4}-\d{4}$/, "year must be in YYYY-YYYY format").optional()
});

const financialYearQuerySchema = z.object({
  financialYear: z.string().regex(/^\d{4}-\d{4}$/, "financialYear must be in YYYY-YYYY format")
});

const sectionExpenseQuerySchema = z.object({
  financialYear: z.string().regex(/^\d{4}-\d{4}$/, "financialYear must be in YYYY-YYYY format"),
  section: z.string().trim().min(1, "section is required")
});

export const getTaxSummaryController = asyncHandler(async (req: Request, res: Response) => {
  const parsedQueryResult = taxSummaryQuerySchema.safeParse(req.query);
  if (!parsedQueryResult.success) {
    throw new HttpError(400, "Invalid request data", parsedQueryResult.error.flatten());
  }
  const parsedQuery = parsedQueryResult.data;
  const financialYear = parsedQuery.financialYear ?? parsedQuery.year ?? getFinancialYear(new Date());

  const summary = await getTaxSummary(getUserId(req), financialYear);
  res.status(200).json(summary);
});

export const createTaxRuleController = asyncHandler(async (req: Request, res: Response) => {
  const result = await createTaxRuleService(req.body);
  res.status(201).json(result);
});

export const getTaxSectionExpensesController = asyncHandler(async (req: Request, res: Response) => {
  const parsedQueryResult = sectionExpenseQuerySchema.safeParse(req.query);
  if (!parsedQueryResult.success) {
    throw new HttpError(400, "Invalid request data", parsedQueryResult.error.flatten());
  }

  const result = await getTaxSectionExpenses(
    getUserId(req),
    parsedQueryResult.data.financialYear,
    parsedQueryResult.data.section
  );
  res.status(200).json(result);
});

export const getTaxUtilizationTimelineController = asyncHandler(async (req: Request, res: Response) => {
  const parsedQueryResult = financialYearQuerySchema.safeParse(req.query);
  if (!parsedQueryResult.success) {
    throw new HttpError(400, "Invalid request data", parsedQueryResult.error.flatten());
  }

  const result = await getTaxUtilizationTimeline(getUserId(req), parsedQueryResult.data.financialYear);
  res.status(200).json(result);
});

export const listTaxRulesController = asyncHandler(async (req: Request, res: Response) => {
  const parsedQueryResult = financialYearQuerySchema.safeParse(req.query);
  if (!parsedQueryResult.success) {
    throw new HttpError(400, "Invalid request data", parsedQueryResult.error.flatten());
  }
  const parsedQuery = parsedQueryResult.data;
  const rules = await listTaxRulesService(parsedQuery.financialYear);
  res.status(200).json(rules);
});

export const updateTaxRuleController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await patchTaxRuleService(id, req.body);
  res.status(200).json({ message: "Tax rule updated successfully" });
});

export const deleteTaxRuleController = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  await deleteTaxRuleService(id);
  res.status(200).json({ message: "Tax rule deleted successfully" });
});

export const overrideExpenseTaxController = asyncHandler(async (req: Request, res: Response) => {
  const { expenseId } = req.params;
  await overrideExpenseTaxService(getUserId(req), expenseId, req.body);
  res.status(200).json({ message: "Expense tax metadata updated successfully" });
});
