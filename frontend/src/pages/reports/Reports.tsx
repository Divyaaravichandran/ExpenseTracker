import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getBills, getExpenses } from "../../services/bills.service";
import { Expense } from "../../types/bill";
import { formatCurrencyINR } from "../../utils/currency";
import { formatDateDDMMYYYY, toInputDateValue } from "../../utils/formatDate";
import {
  detectRecurringMerchants,
  filterExpensesByDateRange,
  getCategoryDistribution,
  getMonthComparison,
  getTopMerchants
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

const Reports: React.FC = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [billsCount, setBillsCount] = useState(0);
  const [loading, setLoading] = useState(false);
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
      setLoading(true);
      setError(null);
      try {
        const [expenseList, billList] = await Promise.all([getExpenses(), getBills()]);
        setExpenses(expenseList);
        setBillsCount(billList.length);
      } catch (loadError: any) {
        setExpenses([]);
        setBillsCount(0);
        setError(loadError?.response?.data?.message || "Failed to load reports data");
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, [navigate]);

  const thisMonthExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((expense) => {
      const date = new Date(expense.expense_date);
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    });
  }, [expenses]);

  const monthComparison = useMemo(() => getMonthComparison(expenses), [expenses]);

  const filteredRangeExpenses = useMemo(
    () => filterExpensesByDateRange(expenses, startDate || undefined, endDate || undefined),
    [expenses, startDate, endDate]
  );

  const monthlyTotal = useMemo(
    () => thisMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [thisMonthExpenses]
  );

  const rangeTotal = useMemo(
    () => filteredRangeExpenses.reduce((sum, expense) => sum + expense.amount, 0),
    [filteredRangeExpenses]
  );

  const handleExportMonthlySummaryCsv = () => {
    const topMerchants = getTopMerchants(thisMonthExpenses, 5);
    const categoryDistribution = getCategoryDistribution(thisMonthExpenses);
    const recurringMerchants = detectRecurringMerchants(thisMonthExpenses);

    const rows: string[][] = [
      ["Monthly Summary Report"],
      ["Month", new Date().toLocaleString("en-IN", { month: "long", year: "numeric" })],
      ["Total Expenses", monthlyTotal.toFixed(2)],
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
    const distribution = getCategoryDistribution(filteredRangeExpenses);
    const topMerchants = getTopMerchants(filteredRangeExpenses, 5);

    const rows: string[][] = [
      ["Date Range Report"],
      ["Start Date", startDate ? formatDateDDMMYYYY(startDate) : "N/A"],
      ["End Date", endDate ? formatDateDDMMYYYY(endDate) : "N/A"],
      ["Total Expenses", rangeTotal.toFixed(2)],
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
    <div className="min-h-screen bg-[radial-gradient(1200px_600px_at_15%_0%,rgba(99,102,241,0.32),transparent_45%),radial-gradient(1000px_560px_at_92%_90%,rgba(20,184,166,0.2),transparent_50%),linear-gradient(135deg,#030712_0%,#0a1226_50%,#0a1a33_100%)] text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-[#2d4674] bg-[#0a1530] p-6 shadow-[0_24px_55px_rgba(2,8,24,0.55)] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Expense Management</p>
              <h1 className="mt-2 text-3xl font-bold text-white sm:text-5xl">Reports & Summaries</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                Generate monthly and date-range reports using the same analytics dataset.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-xl border border-[#2f4e83] bg-[#0c1b3b] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:bg-[#11264f]"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate("/transactions")}
                className="rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 px-4 py-2 text-sm font-semibold text-[#04222e] shadow-[0_10px_24px_rgba(45,212,191,0.38)] transition hover:brightness-105"
              >
                Transactions
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-[#2f4a78] bg-[#162746] p-5 shadow-[0_10px_24px_rgba(5,10,26,0.35)]">
              <p className="text-sm text-slate-400">This Month Total</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCurrencyINR(monthlyTotal)}</p>
              <p className={`mt-3 text-sm font-semibold ${monthComparison.percentChange >= 0 ? "text-rose-300" : "text-emerald-300"}`}>
                {monthComparison.percentChange >= 0 ? "▲" : "▼"} {Math.abs(monthComparison.percentChange).toFixed(1)}% vs last month
              </p>
            </article>

            <article className="rounded-2xl border border-[#2f4a78] bg-[#162746] p-5 shadow-[0_10px_24px_rgba(5,10,26,0.35)]">
              <p className="text-sm text-slate-400">Selected Range Total</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCurrencyINR(rangeTotal)}</p>
              <p className="mt-3 text-sm text-slate-400">{filteredRangeExpenses.length} expenses in selected date range</p>
            </article>

            <article className="rounded-2xl border border-teal-800/70 bg-[#162746] p-5 shadow-[0_10px_24px_rgba(5,10,26,0.35)]">
              <p className="text-sm text-slate-400">Uploaded Bills</p>
              <p className="mt-2 text-2xl font-semibold text-teal-300">{billsCount}</p>
              <p className="mt-3 text-sm text-slate-400">Included in monthly summary export</p>
            </article>
          </div>

          <section className="mt-7 rounded-2xl border border-[#294673] bg-[#101f3c] p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-5 lg:items-end">
              <div className="flex flex-col gap-1">
                <label htmlFor="reports-start-date" className="text-xs uppercase tracking-[0.08em] text-slate-400">
                  Start Date
                </label>
                <input
                  id="reports-start-date"
                  type="date"
                  value={startDate}
                  onChange={(event) => setStartDate(event.target.value)}
                  className="h-11 rounded-xl border border-[#3b5b90] bg-[#112447] px-3 text-sm text-slate-100 outline-none focus:border-indigo-400"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="reports-end-date" className="text-xs uppercase tracking-[0.08em] text-slate-400">
                  End Date
                </label>
                <input
                  id="reports-end-date"
                  type="date"
                  value={endDate}
                  onChange={(event) => setEndDate(event.target.value)}
                  className="h-11 rounded-xl border border-[#3b5b90] bg-[#112447] px-3 text-sm text-slate-100 outline-none focus:border-indigo-400"
                />
              </div>
              <button
                type="button"
                onClick={handleExportMonthlySummaryCsv}
                className="h-11 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(99,102,241,0.35)] transition hover:brightness-105"
              >
                Download Monthly CSV
              </button>
              <button
                type="button"
                onClick={handleExportDateRangeCsv}
                className="h-11 rounded-xl border border-[#3b5b90] bg-[#112447] px-4 text-sm font-semibold text-slate-100 transition hover:bg-[#1a335f]"
              >
                Download Date Range CSV
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="h-11 rounded-xl border border-[#3b5b90] bg-[#112447] px-4 text-sm font-semibold text-slate-100 transition hover:bg-[#1a335f]"
              >
                Download PDF
              </button>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Range selected: <span className="text-slate-200">{startDate ? formatDateDDMMYYYY(startDate) : "N/A"}</span> to{" "}
              <span className="text-slate-200">{endDate ? formatDateDDMMYYYY(endDate) : "N/A"}</span>
            </p>
          </section>

          {loading ? <p className="mt-4 text-sm text-slate-300">Loading reports...</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        </section>
      </div>
    </div>
  );
};

export default Reports;
