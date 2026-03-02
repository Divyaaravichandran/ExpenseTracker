import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBills, getExpenses } from "../../services/bills.service";
import ExpenseTrendChart from "../../components/charts/ExpenseTrendChart";
import CategoryPieChart from "../../components/charts/CategoryPieChart";
import { Expense } from "../../types/bill";
import { formatCurrencyINR } from "../../utils/currency";
import dashboardBg from "../../assets/dashboard-bg.png";
import {
  detectOverspendingCategories,
  detectRecurringMerchants,
  detectUnusualHighExpense,
  getBudgetDecisionSupport,
  getCategoryDelta,
  getCategoryDistribution,
  getMonthlyTrend,
  getMonthComparison,
  getWeeklyDailyPatterns
} from "../../utils/analytics";

export const Dashboard = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [billsCount, setBillsCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
  const thisMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((expense) => {
      const date = new Date(expense.expense_date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }, [expenses]);

  const monthComparison = useMemo(() => getMonthComparison(expenses), [expenses]);
  const foodDelta = useMemo(() => getCategoryDelta(expenses, "Food"), [expenses]);
  const monthlyTrend = useMemo(() => getMonthlyTrend(expenses), [expenses]);
  const categoryDistribution = useMemo(() => getCategoryDistribution(thisMonthExpenses), [thisMonthExpenses]);
  const weeklyDailyPattern = useMemo(() => getWeeklyDailyPatterns(expenses), [expenses]);
  const recurringMerchants = useMemo(() => detectRecurringMerchants(thisMonthExpenses), [thisMonthExpenses]);
  const unusualExpense = useMemo(() => detectUnusualHighExpense(thisMonthExpenses), [thisMonthExpenses]);
  const overspendingCategories = useMemo(() => detectOverspendingCategories(categoryDistribution), [categoryDistribution]);
  const budgetSupport = useMemo(() => getBudgetDecisionSupport(expenses), [expenses]);

  const highestCategory = categoryDistribution[0];
  const lowestCategory = categoryDistribution[categoryDistribution.length - 1];

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <div
        className="min-h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `linear-gradient(120deg, rgba(15,23,42,0.25), rgba(15,23,42,0.15)), url(${dashboardBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed"
        }}
      >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <section className="mb-8 rounded-3xl border border-white/20 bg-white/95 p-6 shadow-2xl shadow-slate-900/20 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-100 hover:text-slate-900"
                aria-label="Go back"
              >
                <span className="text-lg">&larr;</span>
              </button>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-600">Expense Management</p>
                <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">Dashboard Overview</h1>
                <p className="mt-1 text-sm text-slate-500">A consolidated view of your expenses and financial insights.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-950"
            >
              Logout
            </button>
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-white/20 bg-white/95 p-6 shadow-xl shadow-slate-900/15 backdrop-blur sm:p-8">
          <h2 className="mb-2 text-xl font-semibold text-slate-900">Quick Actions</h2>
          <p className="mb-6 text-sm text-slate-500">Common tasks to manage your expenses</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <button
              onClick={() => navigate("/upload")}
              className="rounded-xl bg-slate-900 px-6 py-3 font-medium text-white shadow-md transition-all duration-300 hover:bg-slate-950"
            >
              Upload Bill
            </button>
            <button
              onClick={() => navigate("/expenses")}
              className="rounded-xl border border-slate-300 bg-white px-6 py-3 font-medium text-slate-700 transition-all duration-300 hover:border-slate-500 hover:text-slate-900"
            >
              Add Expense
            </button>
            <button
              onClick={() => navigate("/tax-summary")}
              className="rounded-xl border border-transparent bg-sky-700 px-6 py-3 font-medium text-white shadow-md transition-all duration-300 hover:bg-sky-800"
            >
              Tax Summary
            </button>
            <button
              onClick={() => navigate("/transactions")}
              className="rounded-xl border border-transparent bg-emerald-700 px-6 py-3 font-medium text-white shadow-md transition-all duration-300 hover:bg-emerald-800"
            >
              Transactions
            </button>
          </div>
        </section>

        <section className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/95 p-6 shadow-xl shadow-slate-900/10">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full bg-slate-700" />
              Expenses
            </span>
            <p className="text-3xl font-bold text-slate-900 md:text-4xl">{formatCurrencyINR(totalExpenses)}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/95 p-6 shadow-xl shadow-slate-900/10">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full bg-sky-700" />
              This Month
            </span>
            <p className="text-3xl font-bold text-slate-900 md:text-4xl">{formatCurrencyINR(monthComparison.currentMonthTotal)}</p>
          </div>
          <div className="flex flex-col gap-2 rounded-2xl border border-white/15 bg-white/95 p-6 shadow-xl shadow-slate-900/10 sm:col-span-2 xl:col-span-1">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-700" />
              Bills Uploaded
            </span>
            <p className="text-3xl font-bold text-slate-900 md:text-4xl">{billsCount}</p>
          </div>
        </section>

        <section className="mb-8 rounded-3xl border border-white/20 bg-white/95 p-6 shadow-xl shadow-slate-900/10">
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

        <section className="mb-8 grid grid-cols-1 gap-6 2xl:grid-cols-2">
          <ExpenseTrendChart data={monthlyTrend} />
          <CategoryPieChart data={categoryDistribution} />
        </section>

        <section className="mb-8 rounded-3xl border border-white/20 bg-white/95 p-6 shadow-xl shadow-slate-900/10">
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

        <section className="mb-10 rounded-3xl border border-white/20 bg-white/95 p-6 shadow-xl shadow-slate-900/10">
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

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </div>
    </div>
    </div>
  );
};

export default Dashboard;
