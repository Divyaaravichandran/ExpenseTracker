import { Expense } from "../types/bill";
import { monthKey } from "./formatDate";

export interface MonthlyPoint {
  month: string;
  total: number;
}

export interface CategoryShare {
  category: string;
  total: number;
  sharePercent: number;
}

export interface MerchantCount {
  merchant: string;
  count: number;
  totalAmount: number;
}

const getCategoryName = (expense: Expense): string => expense.category?.name?.trim() || "Unknown";

export const filterExpensesByDateRange = (
  expenses: Expense[],
  startDate?: string,
  endDate?: string
): Expense[] => {
  const start = startDate ? new Date(`${startDate}T00:00:00`) : null;
  const end = endDate ? new Date(`${endDate}T23:59:59`) : null;

  return expenses.filter((expense) => {
    const date = new Date(expense.expense_date);
    if (Number.isNaN(date.getTime())) {
      return false;
    }
    if (start && date < start) {
      return false;
    }
    if (end && date > end) {
      return false;
    }
    return true;
  });
};

export const getMonthlyTrend = (expenses: Expense[]): MonthlyPoint[] => {
  const totals = new Map<string, number>();

  expenses.forEach((expense) => {
    const key = monthKey(expense.expense_date);
    totals.set(key, (totals.get(key) ?? 0) + expense.amount);
  });

  return Array.from(totals.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([month, total]) => ({ month, total: Number(total.toFixed(2)) }));
};

export const getMonthComparison = (expenses: Expense[]): {
  currentMonthTotal: number;
  previousMonthTotal: number;
  percentChange: number;
  delta: number;
} => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousDate = new Date(currentYear, currentMonth - 1, 1);
  const previousMonth = previousDate.getMonth();
  const previousYear = previousDate.getFullYear();

  const currentMonthTotal = expenses
    .filter((expense) => {
      const date = new Date(expense.expense_date);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const previousMonthTotal = expenses
    .filter((expense) => {
      const date = new Date(expense.expense_date);
      return date.getMonth() === previousMonth && date.getFullYear() === previousYear;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const delta = currentMonthTotal - previousMonthTotal;
  const percentChange = previousMonthTotal > 0 ? (delta / previousMonthTotal) * 100 : 0;

  return {
    currentMonthTotal: Number(currentMonthTotal.toFixed(2)),
    previousMonthTotal: Number(previousMonthTotal.toFixed(2)),
    delta: Number(delta.toFixed(2)),
    percentChange: Number(percentChange.toFixed(2))
  };
};

export const getCategoryDistribution = (expenses: Expense[]): CategoryShare[] => {
  const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  if (total <= 0) {
    return [];
  }

  const categoryTotals = new Map<string, number>();
  expenses.forEach((expense) => {
    const category = getCategoryName(expense);
    categoryTotals.set(category, (categoryTotals.get(category) ?? 0) + expense.amount);
  });

  return Array.from(categoryTotals.entries())
    .map(([category, amount]) => ({
      category,
      total: Number(amount.toFixed(2)),
      sharePercent: Number(((amount / total) * 100).toFixed(2))
    }))
    .sort((a, b) => b.total - a.total);
};

export const getWeeklyDailyPatterns = (expenses: Expense[]): {
  highestSpendingDay: string;
  averageDailySpending: number;
  totalThisWeek: number;
} => {
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayTotals = new Array<number>(7).fill(0);

  expenses.forEach((expense) => {
    const date = new Date(expense.expense_date);
    dayTotals[date.getDay()] += expense.amount;
  });

  const highestDayIndex = dayTotals.indexOf(Math.max(...dayTotals));

  const dailyTotals = new Map<string, number>();
  expenses.forEach((expense) => {
    const date = new Date(expense.expense_date);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    dailyTotals.set(key, (dailyTotals.get(key) ?? 0) + expense.amount);
  });

  const averageDailySpending =
    dailyTotals.size > 0
      ? Array.from(dailyTotals.values()).reduce((sum, value) => sum + value, 0) / dailyTotals.size
      : 0;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(now.getDate() - now.getDay());

  const totalThisWeek = expenses
    .filter((expense) => new Date(expense.expense_date) >= weekStart)
    .reduce((sum, expense) => sum + expense.amount, 0);

  return {
    highestSpendingDay: dayNames[highestDayIndex],
    averageDailySpending: Number(averageDailySpending.toFixed(2)),
    totalThisWeek: Number(totalThisWeek.toFixed(2))
  };
};

export const detectRecurringMerchants = (expenses: Expense[], minOccurrences = 3): MerchantCount[] => {
  const merchants = new Map<string, { count: number; totalAmount: number }>();

  expenses.forEach((expense) => {
    const merchant = expense.merchant.trim();
    if (!merchant) {
      return;
    }

    const prev = merchants.get(merchant) ?? { count: 0, totalAmount: 0 };
    merchants.set(merchant, {
      count: prev.count + 1,
      totalAmount: prev.totalAmount + expense.amount
    });
  });

  return Array.from(merchants.entries())
    .filter(([, value]) => value.count >= minOccurrences)
    .map(([merchant, value]) => ({
      merchant,
      count: value.count,
      totalAmount: Number(value.totalAmount.toFixed(2))
    }))
    .sort((a, b) => b.count - a.count);
};

export const detectUnusualHighExpense = (expenses: Expense[]): Expense | null => {
  if (expenses.length < 5) {
    return null;
  }

  const values = expenses.map((expense) => expense.amount);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length;
  const std = Math.sqrt(variance);
  const threshold = mean + std * 2;

  const unusual = expenses
    .filter((expense) => expense.amount >= threshold)
    .sort((a, b) => b.amount - a.amount)[0];

  return unusual ?? null;
};

export const detectOverspendingCategories = (categoryShares: CategoryShare[]): CategoryShare[] => {
  return categoryShares.filter((category) => category.sharePercent > 30);
};

export const getTopMerchants = (expenses: Expense[], limit = 5): MerchantCount[] => {
  return detectRecurringMerchants(expenses, 1)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, limit);
};

export const getCategoryDelta = (expenses: Expense[], categoryName: string): number => {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const previousDate = new Date(currentYear, currentMonth - 1, 1);

  const current = expenses
    .filter((expense) => {
      const date = new Date(expense.expense_date);
      return (
        date.getMonth() === currentMonth &&
        date.getFullYear() === currentYear &&
        getCategoryName(expense).toLowerCase() === categoryName.toLowerCase()
      );
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const previous = expenses
    .filter((expense) => {
      const date = new Date(expense.expense_date);
      return (
        date.getMonth() === previousDate.getMonth() &&
        date.getFullYear() === previousDate.getFullYear() &&
        getCategoryName(expense).toLowerCase() === categoryName.toLowerCase()
      );
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  return Number((current - previous).toFixed(2));
};

export const getBudgetDecisionSupport = (expenses: Expense[]): {
  suggestedBudgetLimit: number;
  thisMonthSpend: number;
  overspendingAmount: number;
  savingsSuggestion: number;
} => {
  const now = new Date();
  const thisMonthSpend = expenses
    .filter((expense) => {
      const date = new Date(expense.expense_date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  const last3Months: number[] = [];
  for (let i = 1; i <= 3; i += 1) {
    const reference = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const total = expenses
      .filter((expense) => {
        const date = new Date(expense.expense_date);
        return date.getMonth() === reference.getMonth() && date.getFullYear() === reference.getFullYear();
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
    last3Months.push(total);
  }

  const averageLast3Months = last3Months.length ? last3Months.reduce((sum, value) => sum + value, 0) / last3Months.length : 0;
  const suggestedBudgetLimit = Number((averageLast3Months * 0.95 || thisMonthSpend).toFixed(2));
  const overspendingAmount = Number(Math.max(thisMonthSpend - suggestedBudgetLimit, 0).toFixed(2));

  const foodTotal = expenses
    .filter((expense) => {
      const date = new Date(expense.expense_date);
      const category = getCategoryName(expense).toLowerCase();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear() && category === "food";
    })
    .reduce((sum, expense) => sum + expense.amount, 0);
  const savingsSuggestion = Number((foodTotal * 0.1).toFixed(2));

  return {
    suggestedBudgetLimit,
    thisMonthSpend: Number(thisMonthSpend.toFixed(2)),
    overspendingAmount,
    savingsSuggestion
  };
};
