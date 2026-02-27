import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteExpense, getBills, getExpenses } from "../../services/bills.service";
import { Expense } from "../../types/bill";
import ExpenseTrendChart from "../../components/charts/ExpenseTrendChart";
import CategoryPieChart from "../../components/charts/CategoryPieChart";
import { formatCurrencyINR } from "../../utils/currency";
import { formatDateDDMMYYYY, toInputDateValue } from "../../utils/formatDate";
import {
  detectOverspendingCategories,
  detectRecurringMerchants,
  detectUnusualHighExpense,
  filterExpensesByDateRange,
  getBudgetDecisionSupport,
  getCategoryDelta,
  getCategoryDistribution,
  getMonthlyTrend,
  getMonthComparison,
  getTopMerchants,
  getWeeklyDailyPatterns
} from "../../utils/analytics";

const downloadCsv = (filename: string, rows: string[][]): void => {
  const csv = rows
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [billsCount, setBillsCount] = useState(0);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>(toInputDateValue(new Date()));

  useEffect(() => {
    const now = new Date();
    setStartDate(toInputDateValue(new Date(now.getFullYear(), now.getMonth(), 1)));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      try {
        const [expenseList, billList] = await Promise.all([getExpenses(), getBills()]);
        setExpenses(expenseList);
        setBillsCount(billList.length);
        setError(null);
      } catch {
        setExpenses([]);
        setBillsCount(0);
        setError("Failed to load dashboard data");
      }
    };

    void loadData();
  }, [navigate]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);
  const transactions = showAllTransactions ? expenses : expenses.slice(0, 15);

  const thisMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((expense) => {
      const date = new Date(expense.expense_date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }, [expenses]);
  const thisMonthTotal = useMemo(
    () => thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [thisMonthExpenses]
  );

  const monthComparison = useMemo(() => getMonthComparison(expenses), [expenses]);
  const foodDelta = useMemo(() => getCategoryDelta(expenses, "Food"), [expenses]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(expenses), [expenses]);
  const categoryDistribution = useMemo(() => getCategoryDistribution(thisMonthExpenses), [thisMonthExpenses]);
  const weeklyDailyPattern = useMemo(() => getWeeklyDailyPatterns(expenses), [expenses]);
  const recurringMerchants = useMemo(() => detectRecurringMerchants(thisMonthExpenses), [thisMonthExpenses]);
  const unusualExpense = useMemo(() => detectUnusualHighExpense(thisMonthExpenses), [thisMonthExpenses]);
  const overspendingCategories = useMemo(() => detectOverspendingCategories(categoryDistribution), [categoryDistribution]);
  const budgetSupport = useMemo(() => getBudgetDecisionSupport(expenses), [expenses]);
  const filteredExpenses = useMemo(
    () => filterExpensesByDateRange(expenses, startDate || undefined, endDate || undefined),
    [endDate, expenses, startDate]
  );

  const highestCategory = categoryDistribution[0];
  const lowestCategory = categoryDistribution[categoryDistribution.length - 1];

  const handleDelete = async (expenseId: string) => {
    const shouldDelete = window.confirm("Delete this transaction?");
    if (!shouldDelete) {
      return;
    }

    setDeletingExpenseId(expenseId);
    setError(null);
    setFeedback(null);

    try {
      await deleteExpense(expenseId);
      setExpenses((prev) => prev.filter((expense) => expense._id !== expenseId));
      setFeedback("Transaction deleted successfully.");
    } catch (deleteError: any) {
      setError(deleteError?.response?.data?.message || "Failed to delete transaction");
    } finally {
      setDeletingExpenseId(null);
    }
  };

  const handleExportMonthlySummaryCsv = () => {
    const topMerchants = getTopMerchants(thisMonthExpenses, 5);
    const rows: string[][] = [
      ["Monthly Summary Report"],
      ["Month", new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })],
      ["Total Expenses", thisMonthTotal.toFixed(2)],
      ["Bills Uploaded", String(billsCount)],
      ["Current Month", monthComparison.currentMonthTotal.toFixed(2)],
      ["Previous Month", monthComparison.previousMonthTotal.toFixed(2)],
      ["MoM Percent Change", `${monthComparison.percentChange.toFixed(2)}%`],
      [],
      ["Category Breakdown"],
      ["Category", "Total", "Share %"],
      ...categoryDistribution.map((item) => [item.category, item.total.toFixed(2), item.sharePercent.toFixed(2)]),
      [],
      ["Top 5 Merchants"],
      ["Merchant", "Visits", "Total Amount"],
      ...topMerchants.map((merchant) => [merchant.merchant, String(merchant.count), merchant.totalAmount.toFixed(2)]),
      [],
      ["Recurring Expenses"],
      ["Merchant", "Visits", "Total Amount"],
      ...recurringMerchants.map((merchant) => [merchant.merchant, String(merchant.count), merchant.totalAmount.toFixed(2)])
    ];

    downloadCsv(`monthly-summary-${toInputDateValue(new Date())}.csv`, rows);
  };

  const handleExportDateRangeCsv = () => {
    const distribution = getCategoryDistribution(filteredExpenses);
    const topMerchants = getTopMerchants(filteredExpenses, 5);

    const rows: string[][] = [
      ["Date Range Report"],
      ["Start Date", startDate ? formatDateDDMMYYYY(startDate) : "N/A"],
      ["End Date", endDate ? formatDateDDMMYYYY(endDate) : "N/A"],
      ["Total Expenses", filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)],
      [],
      ["Category Breakdown"],
      ["Category", "Total", "Share %"],
      ...distribution.map((item) => [item.category, item.total.toFixed(2), item.sharePercent.toFixed(2)]),
      [],
      ["Top Merchants"],
      ["Merchant", "Visits", "Total Amount"],
      ...topMerchants.map((merchant) => [merchant.merchant, String(merchant.count), merchant.totalAmount.toFixed(2)])
    ];

    downloadCsv(`date-range-report-${startDate || "start"}-to-${endDate || "end"}.csv`, rows);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100 hover:text-slate-900"
            aria-label="Go back"
          >
            <span className="text-lg">&larr;</span>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Welcome back</h1>
            <p className="mt-1 text-lg text-slate-500">Here&apos;s your expense overview.</p>
          </div>
        </section>

        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-8 shadow-md">
          <h2 className="mb-2 text-xl font-semibold text-slate-900">Quick Actions</h2>
          <p className="mb-6 text-sm text-slate-500">Common tasks to manage your expenses</p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/upload")}
              className="rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-6 py-3 font-medium text-white shadow-md transition-all duration-300 hover:from-blue-600 hover:to-indigo-600 hover:shadow-lg"
            >
              Upload Bill
            </button>
            <button
              onClick={() => navigate("/expenses")}
              className="rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition-all duration-300 hover:border-blue-500 hover:text-blue-600"
            >
              Add Expense
            </button>
            <button
              onClick={() => navigate("/tax-summary")}
              className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white shadow-md transition-all duration-300 hover:bg-black hover:shadow-lg"
            >
              Tax Summary
            </button>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full bg-blue-500" />
              Expenses
            </span>
            <p className="text-3xl font-bold text-slate-900 md:text-4xl">{formatCurrencyINR(totalExpenses)}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              This Month
            </span>
            <p className="text-3xl font-bold text-slate-900 md:text-4xl">{formatCurrencyINR(monthComparison.currentMonthTotal)}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full bg-yellow-400" />
              Bills Uploaded
            </span>
            <p className="text-3xl font-bold text-slate-900 md:text-4xl">{billsCount}</p>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold text-slate-900">Spending Insights & Trend Analysis</h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <p>
              Spending {monthComparison.delta >= 0 ? "increased" : "decreased"} by{" "}
              <span className="font-semibold">{Math.abs(monthComparison.percentChange).toFixed(2)}%</span> compared to last month.
            </p>
            <p>
              Food category {foodDelta >= 0 ? "increased" : "decreased"} by{" "}
              <span className="font-semibold">{formatCurrencyINR(Math.abs(foodDelta))}</span> compared to previous month.
            </p>
            <p>
              You spend most on <span className="font-semibold">{weeklyDailyPattern.highestSpendingDay}</span>. Average daily expense:{" "}
              <span className="font-semibold">{formatCurrencyINR(weeklyDailyPattern.averageDailySpending)}</span>. This week:{" "}
              <span className="font-semibold">{formatCurrencyINR(weeklyDailyPattern.totalThisWeek)}</span>.
            </p>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <ExpenseTrendChart data={monthlyTrend} />
          <CategoryPieChart data={categoryDistribution} />
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold text-slate-900">Smart Financial Insights Engine</h2>
          <ul className="mt-4 space-y-2 text-sm text-slate-700">
            {recurringMerchants.slice(0, 3).map((merchant) => (
              <li key={merchant.merchant}>
                You visited <span className="font-semibold">{merchant.merchant}</span> {merchant.count} times this month.
              </li>
            ))}
            {unusualExpense ? (
              <li>
                Unusual high expense detected: <span className="font-semibold">{unusualExpense.merchant}</span> at{" "}
                <span className="font-semibold">{formatCurrencyINR(unusualExpense.amount)}</span>.
              </li>
            ) : (
              <li>No unusual high expense detected this month.</li>
            )}
            {overspendingCategories.map((category) => (
              <li key={category.category}>
                {category.category} accounts for <span className="font-semibold">{category.sharePercent.toFixed(1)}%</span> of total monthly spend.
              </li>
            ))}
          </ul>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Highest spending category: <span className="font-semibold">{highestCategory?.category || "N/A"}</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              Lowest spending category: <span className="font-semibold">{lowestCategory?.category || "N/A"}</span>
            </div>
          </div>
        </section>

        <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold text-slate-900">Reports & Summaries</h2>
          <div className="mt-4 flex flex-wrap items-end gap-3">
            <div className="flex flex-col">
              <label htmlFor="start-date" className="text-xs text-slate-600">Start Date</label>
              <input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="end-date" className="text-xs text-slate-600">End Date</label>
              <input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleExportMonthlySummaryCsv}
              className="rounded-lg border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
            >
              Download Monthly CSV
            </button>
            <button
              type="button"
              onClick={handleExportDateRangeCsv}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Download Date Range CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-100"
            >
              Download PDF
            </button>
          </div>
          <p className="mt-3 text-sm text-slate-600">
            Selected range total: <span className="font-semibold">{formatCurrencyINR(filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0))}</span>
          </p>
        </section>

        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <h2 className="text-xl font-semibold text-slate-900">Financial Decision Support</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              Suggested budget limit: <span className="font-semibold">{formatCurrencyINR(budgetSupport.suggestedBudgetLimit)}</span>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {budgetSupport.overspendingAmount > 0
                ? `Overspending warning: You exceeded by ${formatCurrencyINR(budgetSupport.overspendingAmount)}`
                : "No overspending warning for this month."}
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              If you reduce food spending by 10%, you save approximately{" "}
              <span className="font-semibold">{formatCurrencyINR(budgetSupport.savingsSuggestion)}</span> per month.
            </div>
          </div>
        </section>

        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Recent Transactions</h2>
              <p className="mt-1 text-sm text-slate-500">Your latest expense entries</p>
            </div>
            <button onClick={() => setShowAllTransactions((prev) => !prev)} className="text-sm font-medium text-blue-600 hover:text-blue-700">
              {showAllTransactions ? "Show Less" : "View All"}
            </button>
          </div>
          {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
          {feedback ? <p className="mb-4 text-sm text-emerald-600">{feedback}</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="px-4 py-4 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Merchant</th>
                  <th className="px-4 py-4 text-left text-sm font-semibold">Category</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">Amount</th>
                  <th className="px-4 py-4 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="border-b border-slate-100 transition-colors duration-150 hover:bg-slate-50">
                    <td className="px-4 py-4 text-slate-700">{formatDateDDMMYYYY(transaction.expense_date)}</td>
                    <td className="px-4 py-4">
                      <span className="font-medium text-slate-900">{transaction.merchant}</span>
                    </td>
                    <td className="px-4 py-4 text-slate-700">{transaction.category?.name ?? "Unknown"}</td>
                    <td className="px-4 py-4 text-right font-semibold text-slate-900">{formatCurrencyINR(transaction.amount)}</td>
                    <td className="px-4 py-4 text-right">
                      <button
                        onClick={() => handleDelete(transaction._id)}
                        disabled={deletingExpenseId === transaction._id}
                        className="text-sm font-medium text-red-600 hover:text-red-700 disabled:opacity-60"
                      >
                        {deletingExpenseId === transaction._id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-slate-500" colSpan={5}>
                      No expenses yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
