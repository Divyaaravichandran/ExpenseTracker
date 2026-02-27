import { Types } from "mongoose";
import { Expense } from "../../models/Expense";
import { ITaxRule, TaxRule } from "../../models/TaxRule";

export interface DefaultTaxRuleInput {
  financialYear: string;
  section: string;
  title: string;
  applicableCategories: string[];
  maxLimit: number;
  limitType: "yearly";
  isActive: boolean;
}

export interface TaxSectionAggregateRow {
  section: string;
  title: string;
  totalSpent: number;
  maxLimit: number;
  remainingEligible: number;
  utilizationPercent: number;
}

export interface TaxExpenseDrilldownRow {
  expenseId: string;
  merchant: string;
  amount: number;
  expenseDate: Date;
  paymentMode: string;
  description: string;
  categoryName: string | null;
}

export interface TaxUtilizationTimelineRow {
  month: string;
  totalSpent: number;
}

export const findActiveTaxRulesByYear = async (financialYear: string): Promise<ITaxRule[]> => {
  return TaxRule.find({
    financialYear,
    isActive: true
  }).sort({ section: 1 });
};

export const findTaxRuleById = async (id: string): Promise<ITaxRule | null> => {
  return TaxRule.findById(id);
};

export const findActiveTaxRuleBySectionAndFinancialYear = async (
  financialYear: string,
  section: string
): Promise<ITaxRule | null> => {
  return TaxRule.findOne({
    financialYear,
    section,
    isActive: true
  });
};

export const findTaxRules = async (financialYear: string): Promise<ITaxRule[]> => {
  return TaxRule.find({ financialYear }).sort({ section: 1, updatedAt: -1 });
};

export const createTaxRule = async (input: {
  financialYear: string;
  section: string;
  title: string;
  applicableCategories: string[];
  maxLimit: number;
  limitType: "yearly";
  isActive?: boolean;
}): Promise<ITaxRule> => {
  return TaxRule.create({
    ...input,
    isActive: input.isActive ?? true
  });
};

export const updateTaxRuleById = async (
  id: string,
  update: Partial<{
    title: string;
    applicableCategories: string[];
    maxLimit: number;
    limitType: "yearly";
    isActive: boolean;
  }>
): Promise<ITaxRule | null> => {
  return TaxRule.findByIdAndUpdate(id, { $set: update }, { new: true });
};

export const softDeleteTaxRuleById = async (id: string): Promise<ITaxRule | null> => {
  return TaxRule.findByIdAndUpdate(id, { $set: { isActive: false } }, { new: true });
};

export const upsertDefaultTaxRules = async (rules: DefaultTaxRuleInput[]): Promise<void> => {
  await Promise.all(
    rules.map((rule) =>
      TaxRule.updateOne(
        { financialYear: rule.financialYear, section: rule.section },
        { $set: rule },
        { upsert: true }
      )
    )
  );
};

export const hasActiveTaxRulesForFinancialYear = async (financialYear: string): Promise<boolean> => {
  const rule = await TaxRule.exists({
    financialYear,
    isActive: true
  });

  return Boolean(rule);
};

export const aggregateTaxSectionsByUserAndFinancialYear = async (
  userId: string,
  financialYear: string
): Promise<TaxSectionAggregateRow[]> => {
  const result = await Expense.aggregate([
    {
      $match: {
        user_id: new Types.ObjectId(userId),
        "tax.eligible": true,
        "tax.financialYear": financialYear,
        "tax.section": { $exists: true, $ne: null }
      }
    },
    {
      $group: { _id: "$tax.section", totalSpent: { $sum: "$amount" } }
    },
    {
      $lookup: {
        from: "tax_rules",
        let: { section: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$financialYear", financialYear] },
                  { $eq: ["$section", "$$section"] },
                  { $eq: ["$isActive", true] }
                ]
              }
            }
          },
          { $project: { _id: 0, title: 1, maxLimit: 1 } }
        ],
        as: "rule"
      }
    },
    {
      $unwind: "$rule"
    },
    {
      $project: {
        _id: 0,
        section: "$_id",
        title: "$rule.title",
        totalSpent: { $round: ["$totalSpent", 2] },
        maxLimit: { $round: ["$rule.maxLimit", 2] }
      }
    },
    {
      $addFields: {
        remainingEligible: {
          $round: [{ $max: [{ $subtract: ["$maxLimit", "$totalSpent"] }, 0] }, 2]
        },
        utilizationPercent: {
          $round: [
            {
              $cond: [
                { $gt: ["$maxLimit", 0] },
                {
                  $multiply: [
                    {
                      $min: [{ $divide: ["$totalSpent", "$maxLimit"] }, 1]
                    },
                    100
                  ]
                },
                0
              ]
            },
            2
          ]
        }
      }
    },
    {
      $sort: { section: 1 }
    }
  ]);

  return result as TaxSectionAggregateRow[];
};

export const aggregateTaxSectionExpensesByUserAndFinancialYear = async (
  userId: string,
  financialYear: string,
  section: string
): Promise<TaxExpenseDrilldownRow[]> => {
  const result = await Expense.aggregate([
    {
      $match: {
        user_id: new Types.ObjectId(userId),
        "tax.eligible": true,
        "tax.financialYear": financialYear,
        "tax.section": section
      }
    },
    {
      $lookup: {
        from: "categories",
        localField: "category_id",
        foreignField: "_id",
        as: "categoryDoc"
      }
    },
    {
      $project: {
        _id: 0,
        expenseId: { $toString: "$_id" },
        merchant: 1,
        amount: { $round: ["$amount", 2] },
        expenseDate: "$expense_date",
        paymentMode: "$payment_mode",
        description: 1,
        categoryName: {
          $ifNull: [{ $arrayElemAt: ["$categoryDoc.name", 0] }, null]
        }
      }
    },
    {
      $sort: {
        expenseDate: -1
      }
    }
  ]);

  return result as TaxExpenseDrilldownRow[];
};

export const aggregateTaxUtilizationTimelineByUserAndFinancialYear = async (
  userId: string,
  financialYear: string
): Promise<TaxUtilizationTimelineRow[]> => {
  const result = await Expense.aggregate([
    {
      $match: {
        user_id: new Types.ObjectId(userId),
        "tax.eligible": true,
        "tax.financialYear": financialYear
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: "%Y-%m",
            date: "$expense_date"
          }
        },
        totalSpent: { $sum: "$amount" }
      }
    },
    {
      $project: {
        _id: 0,
        month: "$_id",
        totalSpent: { $round: ["$totalSpent", 2] }
      }
    },
    {
      $sort: { month: 1 }
    }
  ]);

  return result as TaxUtilizationTimelineRow[];
};

export const findExpenseByIdAndUser = async (expenseId: string, userId: string) => {
  return Expense.findOne({
    _id: new Types.ObjectId(expenseId),
    user_id: new Types.ObjectId(userId)
  });
};

export const updateExpenseTaxByIdAndUser = async (
  expenseId: string,
  userId: string,
  tax: {
    eligible: boolean;
    section?: string;
    maxLimit?: number;
    financialYear?: string;
  }
) => {
  return Expense.findOneAndUpdate(
    {
      _id: new Types.ObjectId(expenseId),
      user_id: new Types.ObjectId(userId)
    },
    { $set: { tax } },
    { new: true }
  );
};
