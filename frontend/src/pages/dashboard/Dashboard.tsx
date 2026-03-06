import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { getBills, getExpenses } from "../../services/bills.service";
import { Expense } from "../../types/bill";
import { formatCurrencyINR } from "../../utils/currency";
import {
  detectOverspendingCategories,
  detectRecurringMerchants,
  detectUnusualHighExpense,
  getBudgetDecisionSupport,
  getCategoryDistribution,
  getMonthlyTrend,
  getMonthComparison
} from "../../utils/analytics";
import KpiCard, { KpiCardItem } from "./components/KpiCard";
import TrendChartCard from "./components/TrendChartCard";
import DonutChartCard from "./components/DonutChartCard";
import InsightAlertCard, { InsightAlertItem } from "./components/InsightAlertCard";
import DecisionSupportCard, { DecisionSupportItem } from "./components/DecisionSupportCard";

const last12MonthLabels = (): string[] => {
  const labels: string[] = [];
  const now = new Date();
  for (let offset = 11; offset >= 0; offset -= 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    labels.push(
      date.toLocaleDateString("en-US", {
        month: "short"
      })
    );
  }
  return labels;
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [billsCount, setBillsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const darkMode = true;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [expenseList, billList] = await Promise.all([getExpenses(), getBills()]);
        setExpenses(expenseList);
        setBillsCount(billList.length);
        setError(null);
      } catch {
        setExpenses([]);
        setBillsCount(0);
        setError("Failed to load dashboard analytics.");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [navigate]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);
  const monthComparison = useMemo(() => getMonthComparison(expenses), [expenses]);
  const monthlyTrendRaw = useMemo(() => getMonthlyTrend(expenses), [expenses]);
  const budgetSupport = useMemo(() => getBudgetDecisionSupport(expenses), [expenses]);

  const thisMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((expense) => {
      const date = new Date(expense.expense_date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }, [expenses]);

  const categoryDistribution = useMemo(() => getCategoryDistribution(thisMonthExpenses), [thisMonthExpenses]);
  const recurringMerchants = useMemo(() => detectRecurringMerchants(thisMonthExpenses, 2), [thisMonthExpenses]);
  const unusualExpense = useMemo(() => detectUnusualHighExpense(thisMonthExpenses), [thisMonthExpenses]);
  const overspendingCategories = useMemo(() => detectOverspendingCategories(categoryDistribution), [categoryDistribution]);

  const monthlyTrend = useMemo(() => {
    const labels = last12MonthLabels();
    const mapped = new Map(
      monthlyTrendRaw.map((point) => [
        new Date(`${point.month}-01`).toLocaleDateString("en-US", { month: "short" }),
        point.total
      ])
    );
    return labels.map((label) => ({
      month: label,
      total: mapped.get(label) ?? 0
    }));
  }, [monthlyTrendRaw]);

  const topCategory = categoryDistribution[0];
  const billsDelta = monthComparison.previousMonthTotal > 0 ? (billsCount / Math.max(1, expenses.length)) * 4.3 : 0;
  const budgetUsagePercent = budgetSupport.suggestedBudgetLimit
    ? Math.min((budgetSupport.thisMonthSpend / budgetSupport.suggestedBudgetLimit) * 100, 100)
    : 0;
  const savingsPercent = budgetSupport.thisMonthSpend
    ? Math.min((budgetSupport.savingsSuggestion / budgetSupport.thisMonthSpend) * 100, 100)
    : 0;

  const kpis: KpiCardItem[] = [
    {
      title: "Total Spend",
      value: formatCurrencyINR(totalExpenses),
      icon: "wallet",
      trendValue: `${Math.abs(monthComparison.percentChange).toFixed(1)}%`,
      trendDirection: monthComparison.percentChange >= 0 ? "up" : "down"
    },
    {
      title: "This Month",
      value: formatCurrencyINR(monthComparison.currentMonthTotal),
      icon: "calendar",
      trendValue: `${Math.abs(monthComparison.percentChange).toFixed(1)}%`,
      trendDirection: monthComparison.percentChange >= 0 ? "up" : "down"
    },
    {
      title: "Bills Uploaded",
      value: `${billsCount}`,
      icon: "receipt",
      trendValue: `${billsDelta.toFixed(1)}%`,
      trendDirection: billsDelta >= 0 ? "up" : "down"
    },
    {
      title: "Top Category",
      value: topCategory?.category ?? "N/A",
      icon: "spark",
      trendValue: topCategory ? `${topCategory.sharePercent.toFixed(1)}%` : "0.0%",
      trendDirection: "up"
    }
  ];

  const insights: InsightAlertItem[] = [
    unusualExpense
      ? {
          type: "warning",
          title: "High Expense Alert",
          description: (
            <>
              Unusual spike at <strong>{unusualExpense.merchant}</strong> for{" "}
              <strong>{formatCurrencyINR(unusualExpense.amount)}</strong>.
            </>
          )
        }
      : {
          type: "info",
          title: "No Outlier Spend",
          description: <>No unusual high expense detected this month.</>
        },
    recurringMerchants[0]
      ? {
          type: "info",
          title: "Frequent Vendor Insight",
          description: (
            <>
              <strong>{recurringMerchants[0].merchant}</strong> appeared <strong>{recurringMerchants[0].count}x</strong>{" "}
              in your monthly spend.
            </>
          )
        }
      : {
          type: "info",
          title: "Vendor Pattern Pending",
          description: <>More recurring activity is needed to detect frequent vendors.</>
        },
    overspendingCategories[0]
      ? {
          type: "success",
          title: "Spend Optimization Signal",
          description: (
            <>
              Reducing <strong>{overspendingCategories[0].category}</strong> by 10% can improve monthly cash flow.
            </>
          )
        }
      : {
          type: "success",
          title: "Healthy Category Split",
          description: <>No single category is dominating your monthly spend.</>
        }
  ];

  const decisionCards: DecisionSupportItem[] = [
    {
      icon: "target",
      title: "Suggested Budget Limit",
      value: formatCurrencyINR(budgetSupport.suggestedBudgetLimit),
      subtext: `${budgetUsagePercent.toFixed(0)}% used`,
      progress: budgetUsagePercent,
      tone: budgetUsagePercent > 90 ? "warning" : "success"
    },
    {
      icon: "alert",
      title: "Overspending Risk",
      value:
        budgetSupport.overspendingAmount > 0
          ? formatCurrencyINR(budgetSupport.overspendingAmount)
          : "Within Budget",
      subtext: budgetSupport.overspendingAmount > 0 ? "High risk this month" : "Low risk this month",
      progress: budgetSupport.overspendingAmount > 0 ? 100 : 20,
      tone: budgetSupport.overspendingAmount > 0 ? "danger" : "success"
    },
    {
      icon: "leaf",
      title: "Top Category Reduction Potential",
      value: formatCurrencyINR(budgetSupport.savingsSuggestion),
      subtext:
        budgetSupport.savingsCategory !== "N/A"
          ? `${savingsPercent.toFixed(0)}% potential savings by trimming ${budgetSupport.savingsCategory} by 10%`
          : `${savingsPercent.toFixed(0)}% potential savings`,
      progress: savingsPercent,
      tone: "info"
    }
  ];

  return (
    <div className="app-page-bg font-sans" style={{ fontFamily: "Inter, Poppins, ui-sans-serif, system-ui" }}>
      <div className="app-page-shell flex flex-col gap-4 sm:gap-6">
        <main className="min-w-0 flex-1">
          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="app-page-panel backdrop-blur-md sm:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="app-page-eyebrow">Intelligent Expense & Bill Management Platform</p>
                <h1 className="app-page-title">Expense Dashboard</h1>
                <p className="app-page-subtitle">Real-time financial monitoring & insights</p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {loading
                ? Array.from({ length: 4 }).map((_, idx) => (
                    <div
                      key={`kpi-skeleton-${idx + 1}`}
                      className={`h-28 animate-pulse rounded-2xl border ${
                        darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-white/80"
                      }`}
                    />
                  ))
                : kpis.map((kpi) => <KpiCard key={kpi.title} item={kpi} darkMode={darkMode} />)}
            </div>
          </motion.section>

          <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-3">
            <div className="xl:col-span-2">
              <TrendChartCard loading={loading} data={monthlyTrend} darkMode={darkMode} />
            </div>
            <div className="xl:col-span-1">
              <DonutChartCard loading={loading} data={categoryDistribution} darkMode={darkMode} />
            </div>
          </div>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.3 }}
            className={`mt-4 rounded-[20px] border p-5 ${
              darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-white/75"
            }`}
          >
            <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>Smart Financial Insights</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {loading
                ? Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={`insight-skeleton-${idx + 1}`}
                      className={`h-28 animate-pulse rounded-2xl border ${
                        darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-white/80"
                      }`}
                    />
                  ))
                : insights.map((insight) => <InsightAlertCard key={insight.title} item={insight} darkMode={darkMode} />)}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.3 }}
            className={`mt-4 rounded-[20px] border p-5 ${
              darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-white/75"
            }`}
          >
            <h2 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>Financial Decision Support</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              {loading
                ? Array.from({ length: 3 }).map((_, idx) => (
                    <div
                      key={`decision-skeleton-${idx + 1}`}
                      className={`h-40 animate-pulse rounded-2xl border ${
                        darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-white/80"
                      }`}
                    />
                  ))
                : decisionCards.map((item) => <DecisionSupportCard key={item.title} item={item} darkMode={darkMode} />)}
            </div>
          </motion.section>

          <AnimatePresence>
            {!loading && expenses.length === 0 ? (
              <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                className={`mt-4 rounded-[20px] border p-6 text-center ${
                  darkMode ? "border-white/10 bg-white/5" : "border-slate-200 bg-white/75"
                }`}
              >
                <h3 className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>No analytics data yet</h3>
                <p className={`mt-1 text-sm ${darkMode ? "text-slate-300" : "text-slate-600"}`}>
                  Add expenses from the Unified Expense Hub to unlock trend and insight visualizations.
                </p>
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/expenses")}
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-500"
                  >
                    Open Expense Hub
                  </button>
                </div>
              </motion.section>
            ) : null}
          </AnimatePresence>

          {error ? (
            <p className={`mt-4 text-sm ${darkMode ? "text-rose-300" : "text-rose-600"}`}>{error}</p>
          ) : null}
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
