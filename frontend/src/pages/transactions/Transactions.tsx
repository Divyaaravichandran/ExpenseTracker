import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteExpense, getBills, getCategories, getExpenses } from "../../services/bills.service";
import { Category, Expense } from "../../types/bill";
import { formatCurrencyINR } from "../../utils/currency";
import { formatDateDDMMYYYY, toInputDateValue } from "../../utils/formatDate";
import {
  detectRecurringMerchants,
  filterExpensesByDateRange,
  getCategoryDistribution,
  getMonthComparison,
  getTopMerchants
} from "../../utils/analytics";

type TransactionFilter = "all" | "manual" | "uploaded";

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

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [billsCount, setBillsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>("all");
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
      setLoading(true);
      setError(null);
      try {
        const [expenseList, categoryList, billList] = await Promise.all([getExpenses(), getCategories(), getBills()]);
        setExpenses(expenseList);
        setCategories(categoryList);
        setBillsCount(billList.length);
      } catch (loadError: any) {
        setExpenses([]);
        setCategories([]);
        setBillsCount(0);
        setError(loadError?.response?.data?.message || "Failed to load transactions");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [navigate]);

  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((category) => {
      map[category._id] = category.name;
    });
    return map;
  }, [categories]);

  const filteredTransactions = useMemo(() => {
    if (activeFilter === "manual") {
      return expenses.filter((expense) => !expense.receipt_id);
    }

    if (activeFilter === "uploaded") {
      return expenses.filter((expense) => Boolean(expense.receipt_id));
    }

    return expenses;
  }, [activeFilter, expenses]);

  const totalAmount = useMemo(
    () => filteredTransactions.reduce((sum, expense) => sum + expense.amount, 0),
    [filteredTransactions]
  );
  const thisMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((expense) => {
      const date = new Date(expense.expense_date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }, [expenses]);
  const monthComparison = useMemo(() => getMonthComparison(expenses), [expenses]);
  const filteredReportExpenses = useMemo(
    () => filterExpensesByDateRange(expenses, startDate || undefined, endDate || undefined),
    [endDate, expenses, startDate]
  );

  const handleExportMonthlySummaryCsv = () => {
    const topMerchants = getTopMerchants(thisMonthExpenses, 5);
    const categoryDistribution = getCategoryDistribution(thisMonthExpenses);
    const recurringMerchants = detectRecurringMerchants(thisMonthExpenses);
    const thisMonthTotal = thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0);

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
    const distribution = getCategoryDistribution(filteredReportExpenses);
    const topMerchants = getTopMerchants(filteredReportExpenses, 5);

    const rows: string[][] = [
      ["Date Range Report"],
      ["Start Date", startDate ? formatDateDDMMYYYY(startDate) : "N/A"],
      ["End Date", endDate ? formatDateDDMMYYYY(endDate) : "N/A"],
      ["Total Expenses", filteredReportExpenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)],
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-indigo-50">
      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10">
        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-indigo-100 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-indigo-600">Expense Management</p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900">Transactions</h1>
              <p className="mt-2 text-sm text-slate-600">Review all expense records with source and tax eligibility details.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate("/expenses")}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Add Expense
              </button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-cyan-100 backdrop-blur">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setActiveFilter("all")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeFilter === "all"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                Show All Bills
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("manual")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeFilter === "manual"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                Show Manually Added Data
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter("uploaded")}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  activeFilter === "uploaded"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                    : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                Show Uploaded Data
              </button>
            </div>
            <div className="text-sm font-medium text-slate-700">
              Total ({filteredTransactions.length}): <span className="text-slate-900">{formatCurrencyINR(totalAmount)}</span>
            </div>
          </div>

          {loading ? <p className="mt-5 text-sm text-slate-600">Loading transactions...</p> : null}
          {error ? <p className="mt-5 text-sm text-red-600">{error}</p> : null}
          {feedback ? <p className="mt-5 text-sm text-emerald-600">{feedback}</p> : null}

          {!loading ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Date</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Merchant</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Category</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Source</th>
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide">Tax Eligibility</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide">Amount</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map((expense) => {
                    const isTaxEligible = Boolean(expense.tax?.eligible);
                    const isUploaded = Boolean(expense.receipt_id);
                    return (
                      <tr key={expense._id} className="border-b border-slate-100 hover:bg-slate-50/70">
                        <td className="px-3 py-3 text-sm text-slate-700">{formatDateDDMMYYYY(expense.expense_date)}</td>
                        <td className="px-3 py-3 text-sm font-medium text-slate-900">{expense.merchant}</td>
                        <td className="px-3 py-3 text-sm text-slate-700">
                          {expense.category?.name ?? categoryNameMap[expense.category_id] ?? "Unknown"}
                        </td>
                        <td className="px-3 py-3 text-sm text-slate-700">{isUploaded ? "Uploaded Bill" : "Manual Entry"}</td>
                        <td className="px-3 py-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              isTaxEligible ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                            }`}
                          >
                            {isTaxEligible ? "Tax Eligible" : "Not Tax Eligible"}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-right text-sm font-semibold text-slate-900">{formatCurrencyINR(expense.amount)}</td>
                        <td className="px-3 py-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(expense._id)}
                            disabled={deletingExpenseId === expense._id}
                            className="text-sm font-medium text-rose-600 hover:text-rose-700 disabled:opacity-60"
                          >
                            {deletingExpenseId === expense._id ? "Deleting..." : "Delete"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {!loading && filteredTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-3 py-8 text-center text-sm text-slate-500">
                        No transactions found for the selected filter.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-indigo-100 backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-900">Reports & Summaries</h2>
          <p className="mt-1 text-sm text-slate-600">Generate monthly and date-range reports directly from transactions data.</p>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
            <div className="flex flex-col">
              <label htmlFor="tx-start-date" className="text-xs text-slate-600">
                Start Date
              </label>
              <input
                id="tx-start-date"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label htmlFor="tx-end-date" className="text-xs text-slate-600">
                End Date
              </label>
              <input
                id="tx-end-date"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleExportMonthlySummaryCsv}
              className="rounded-lg border border-indigo-700 bg-indigo-700 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-800"
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
            Selected range total:{" "}
            <span className="font-semibold">
              {formatCurrencyINR(filteredReportExpenses.reduce((sum, expense) => sum + expense.amount, 0))}
            </span>
          </p>
        </section>
      </div>
    </div>
  );
};

export default Transactions;
