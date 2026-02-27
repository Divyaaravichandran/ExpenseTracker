import { Types } from "mongoose";
import { z } from "zod";
import { HttpError } from "../../utils/HttpError";
import { findCategoryById } from "../../services/category.repository";
import { getFinancialYear, isValidFinancialYear } from "../../libs/core/utils/financial-year";
import {
  aggregateTaxSectionsByUserAndFinancialYear,
  aggregateTaxSectionExpensesByUserAndFinancialYear,
  aggregateTaxUtilizationTimelineByUserAndFinancialYear,
  createTaxRule,
  findActiveTaxRuleBySectionAndFinancialYear,
  findExpenseByIdAndUser,
  findTaxRuleById,
  findTaxRules,
  findActiveTaxRulesByYear,
  hasActiveTaxRulesForFinancialYear,
  softDeleteTaxRuleById,
  updateExpenseTaxByIdAndUser,
  updateTaxRuleById,
  upsertDefaultTaxRules
} from "./tax.repository";
import { DEFAULT_TAX_RULES } from "./tax.seed";

interface TaxMeta {
  eligible: boolean;
  section?: string;
  maxLimit?: number;
  financialYear?: string;
}

interface TaxSectionSummary {
  section: string;
  title: string;
  totalSpent: number;
  maxLimit: number;
  remainingEligible: number;
  utilizationPercent: number;
}

export interface TaxSummaryResult {
  financialYear: string;
  sections: TaxSectionSummary[];
  totalTaxEligibleAmount: number;
}

export interface TaxExpenseDrilldownItem {
  expenseId: string;
  merchant: string;
  amount: number;
  expenseDate: string;
  paymentMode: string;
  description: string;
  categoryName: string | null;
}

export interface TaxExpenseDrilldownResult {
  financialYear: string;
  section: string;
  totalSpent: number;
  expenses: TaxExpenseDrilldownItem[];
}

export interface TaxUtilizationTimelineItem {
  month: string;
  totalSpent: number;
}

export interface TaxUtilizationTimelineResult {
  financialYear: string;
  timeline: TaxUtilizationTimelineItem[];
}

const taxRulePayloadSchema = z.object({
  financialYear: z.string().regex(/^\d{4}-\d{4}$/, "financialYear must be in YYYY-YYYY format"),
  section: z.string().trim().min(1, "section is required"),
  title: z.string().trim().min(1, "title is required"),
  applicableCategories: z.array(z.string().trim().min(1)).min(1, "applicableCategories must not be empty"),
  maxLimit: z.number().nonnegative("maxLimit must be >= 0"),
  limitType: z.literal("yearly"),
  isActive: z.boolean().optional()
});

const taxRulePatchSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    applicableCategories: z.array(z.string().trim().min(1)).min(1).optional(),
    maxLimit: z.number().nonnegative().optional(),
    limitType: z.literal("yearly").optional(),
    isActive: z.boolean().optional()
  })
  .refine((payload) => Object.keys(payload).length > 0, "At least one field must be provided");

const taxOverrideSchema = z
  .object({
    eligible: z.boolean(),
    section: z.string().trim().min(1).optional(),
    maxLimit: z.number().nonnegative().optional(),
    financialYear: z.string().regex(/^\d{4}-\d{4}$/, "financialYear must be in YYYY-YYYY format").optional()
  })
  .superRefine((payload, ctx) => {
    if (payload.eligible && !payload.section) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "section is required when eligible=true",
        path: ["section"]
      });
    }
  });

const assertFinancialYear = (financialYear: string): string => {
  if (!isValidFinancialYear(financialYear)) {
    throw new HttpError(400, "financialYear must be in YYYY-YYYY format");
  }
  return financialYear;
};

/**
 * Resolves tax eligibility metadata for an expense from active rules of the computed financial year.
 */
export const resolveTaxMetaForExpense = async (categoryId: string, expenseDate: Date): Promise<TaxMeta> => {
  const category = await findCategoryById(categoryId);
  if (!category) {
    throw new HttpError(404, "Category not found for provided category_id");
  }

  const financialYear = getFinancialYear(expenseDate);
  const rules = await findActiveTaxRulesByYear(financialYear);
  const categoryName = category.name.trim().toLowerCase();
  const matchedRule = rules.find((rule) => rule.applicableCategories.some((name) => name.trim().toLowerCase() === categoryName));

  if (!matchedRule) {
    console.info(`[tax.service] No active tax rule matched category "${category.name}" for FY ${financialYear}`);
    return { eligible: false };
  }

  console.info(`[tax.service] Matched category "${category.name}" to section ${matchedRule.section} for FY ${financialYear}`);
  return {
    eligible: true,
    section: matchedRule.section,
    maxLimit: matchedRule.maxLimit,
    financialYear
  };
};

/**
 * Builds financial-year tax summary grouped by tax section for a user.
 */
export const getTaxSummary = async (userId: string, financialYear: string): Promise<TaxSummaryResult> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new HttpError(401, "Invalid user id in token");
  }

  const validatedFinancialYear = assertFinancialYear(financialYear);
  const hasRules = await hasActiveTaxRulesForFinancialYear(validatedFinancialYear);
  if (!hasRules) {
    throw new HttpError(404, `No active tax rules found for financial year ${validatedFinancialYear}`);
  }

  console.info(`[tax.service] Building tax summary for user ${userId} and FY ${validatedFinancialYear}`);
  const rows = await aggregateTaxSectionsByUserAndFinancialYear(userId, validatedFinancialYear);

  const sections = rows.map((row) => {
    const totalSpent = Number(row.totalSpent.toFixed(2));
    const maxLimit = Number(row.maxLimit.toFixed(2));
    const remainingEligible = Number(Math.max(maxLimit - totalSpent, 0).toFixed(2));
    const utilizationPercent = Number(
      (maxLimit > 0 ? Math.min((totalSpent / maxLimit) * 100, 100) : 0).toFixed(2)
    );

    return {
      section: row.section,
      title: row.title,
      totalSpent,
      maxLimit,
      remainingEligible,
      utilizationPercent
    };
  });

  const totalTaxEligibleAmount = Number(
    sections.reduce((sum, item) => sum + Math.min(item.totalSpent, item.maxLimit), 0).toFixed(2)
  );

  return {
    financialYear: validatedFinancialYear,
    sections,
    totalTaxEligibleAmount
  };
};

/**
 * Returns expense-level breakdown for a tax section in a financial year.
 */
export const getTaxSectionExpenses = async (
  userId: string,
  financialYear: string,
  section: string
): Promise<TaxExpenseDrilldownResult> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new HttpError(401, "Invalid user id in token");
  }

  const validatedFinancialYear = assertFinancialYear(financialYear);
  const normalizedSection = section.trim();
  if (!normalizedSection) {
    throw new HttpError(400, "section is required");
  }

  const rows = await aggregateTaxSectionExpensesByUserAndFinancialYear(userId, validatedFinancialYear, normalizedSection);
  const expenses = rows.map((row) => ({
    expenseId: row.expenseId,
    merchant: row.merchant,
    amount: Number(row.amount.toFixed(2)),
    expenseDate: row.expenseDate.toISOString(),
    paymentMode: row.paymentMode,
    description: row.description,
    categoryName: row.categoryName
  }));

  const totalSpent = Number(expenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2));
  return {
    financialYear: validatedFinancialYear,
    section: normalizedSection,
    totalSpent,
    expenses
  };
};

/**
 * Returns monthly tax-eligible spend timeline for a financial year.
 */
export const getTaxUtilizationTimeline = async (
  userId: string,
  financialYear: string
): Promise<TaxUtilizationTimelineResult> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new HttpError(401, "Invalid user id in token");
  }

  const validatedFinancialYear = assertFinancialYear(financialYear);
  const timelineRows = await aggregateTaxUtilizationTimelineByUserAndFinancialYear(userId, validatedFinancialYear);

  return {
    financialYear: validatedFinancialYear,
    timeline: timelineRows.map((row) => ({
      month: row.month,
      totalSpent: Number(row.totalSpent.toFixed(2))
    }))
  };
};

/**
 * Creates a tax rule after validation.
 */
export const createTaxRuleService = async (
  payload: z.input<typeof taxRulePayloadSchema>
): Promise<{ id: string }> => {
  const parsedResult = taxRulePayloadSchema.safeParse(payload);
  if (!parsedResult.success) {
    throw new HttpError(400, "Invalid request data", parsedResult.error.flatten());
  }
  const parsed = parsedResult.data;
  assertFinancialYear(parsed.financialYear);

  let createdRule;
  try {
    createdRule = await createTaxRule(parsed);
  } catch (error: unknown) {
    const mongoError = error as { code?: number };
    if (mongoError.code === 11000) {
      throw new HttpError(409, `Tax rule already exists for FY ${parsed.financialYear} and section ${parsed.section}`);
    }
    throw error;
  }
  console.info(`[tax.service] Created tax rule ${createdRule.section} for FY ${createdRule.financialYear}`);
  return { id: String(createdRule._id) };
};

/**
 * Returns tax rules for a financial year.
 */
export const listTaxRulesService = async (financialYear: string) => {
  const validatedFinancialYear = assertFinancialYear(financialYear);
  console.info(`[tax.service] Listing tax rules for FY ${validatedFinancialYear}`);
  return findTaxRules(validatedFinancialYear);
};

/**
 * Applies partial updates to a tax rule.
 */
export const patchTaxRuleService = async (
  id: string,
  payload: z.input<typeof taxRulePatchSchema>
): Promise<void> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "Invalid tax rule id");
  }

  const parsedResult = taxRulePatchSchema.safeParse(payload);
  if (!parsedResult.success) {
    throw new HttpError(400, "Invalid request data", parsedResult.error.flatten());
  }
  const parsed = parsedResult.data;
  const existingRule = await findTaxRuleById(id);
  if (!existingRule) {
    throw new HttpError(404, "Tax rule not found");
  }

  await updateTaxRuleById(id, parsed);
  console.info(`[tax.service] Updated tax rule ${id}`);
};

/**
 * Soft-deletes a tax rule by marking it inactive.
 */
export const deleteTaxRuleService = async (id: string): Promise<void> => {
  if (!Types.ObjectId.isValid(id)) {
    throw new HttpError(400, "Invalid tax rule id");
  }

  const deleted = await softDeleteTaxRuleById(id);
  if (!deleted) {
    throw new HttpError(404, "Tax rule not found");
  }

  console.info(`[tax.service] Soft deleted tax rule ${id}`);
};

/**
 * Overrides tax eligibility metadata for an expense.
 */
export const overrideExpenseTaxService = async (
  userId: string,
  expenseId: string,
  payload: z.input<typeof taxOverrideSchema>
): Promise<void> => {
  if (!Types.ObjectId.isValid(userId)) {
    throw new HttpError(401, "Invalid user id in token");
  }

  if (!Types.ObjectId.isValid(expenseId)) {
    throw new HttpError(400, "Invalid expense id");
  }

  const parsedResult = taxOverrideSchema.safeParse(payload);
  if (!parsedResult.success) {
    throw new HttpError(400, "Invalid request data", parsedResult.error.flatten());
  }
  const parsed = parsedResult.data;

  const expense = await findExpenseByIdAndUser(expenseId, userId);
  if (!expense) {
    throw new HttpError(404, "Expense not found");
  }

  if (!parsed.eligible) {
    await updateExpenseTaxByIdAndUser(expenseId, userId, { eligible: false });
    console.info(`[tax.service] Marked expense ${expenseId} as tax-ineligible`);
    return;
  }

  const financialYear = parsed.financialYear ?? expense.tax.financialYear ?? getFinancialYear(expense.expense_date);
  assertFinancialYear(financialYear);
  const section = parsed.section?.trim() ?? expense.tax.section;

  if (!section) {
    throw new HttpError(400, "section is required when eligible=true");
  }

  const matchingRule = await findActiveTaxRuleBySectionAndFinancialYear(financialYear, section);
  const maxLimit = parsed.maxLimit ?? matchingRule?.maxLimit ?? expense.tax.maxLimit;

  await updateExpenseTaxByIdAndUser(expenseId, userId, {
    eligible: true,
    section,
    maxLimit,
    financialYear
  });
  console.info(`[tax.service] Overrode tax details for expense ${expenseId} to section ${section}`);
};

export const ensureDefaultTaxRules = async (): Promise<void> => {
  await upsertDefaultTaxRules(DEFAULT_TAX_RULES);
};
