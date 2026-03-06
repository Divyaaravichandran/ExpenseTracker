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

  const rangeCategoryDistribution = useMemo(
    () => getCategoryDistribution(filteredRangeExpenses),
    [filteredRangeExpenses]
  );

  const rangeTopMerchants = useMemo(
    () => getTopMerchants(filteredRangeExpenses, 5),
    [filteredRangeExpenses]
  );

  const rangeRecurringMerchants = useMemo(
    () => detectRecurringMerchants(filteredRangeExpenses, 2),
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
    const rows: string[][] = [
      ["Date Range Report"],
      ["Start Date", startDate ? formatDateDDMMYYYY(startDate) : "N/A"],
      ["End Date", endDate ? formatDateDDMMYYYY(endDate) : "N/A"],
      ["Total Expenses", rangeTotal.toFixed(2)],
      [],
      ["Category Breakdown"],
      ["Category", "Total", "Share %"],
      ...rangeCategoryDistribution.map((item) => [item.category, item.total.toFixed(2), item.sharePercent.toFixed(2)]),
      [],
      ["Top Merchants"],
      ["Merchant", "Visits", "Total Amount"],
      ...rangeTopMerchants.map((merchant) => [merchant.merchant, String(merchant.count), merchant.totalAmount.toFixed(2)])
    ];

    downloadCsv(`date-range-report-${startDate || "start"}-to-${endDate || "end"}.csv`, rows);
  };

  const handleDownloadReportPdf = () => {
    const escapeHtml = (value: string): string =>
      value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");

    const reportTitle = "Expense Report";
    const startDateLabel = startDate ? formatDateDDMMYYYY(startDate) : "N/A";
    const endDateLabel = endDate ? formatDateDDMMYYYY(endDate) : "N/A";

    const tableRows = filteredRangeExpenses.length
      ? filteredRangeExpenses
          .map((expense) => {
            const cells = [
              formatDateDDMMYYYY(expense.expense_date),
              expense.merchant || "-",
              expense.category?.name || "-",
              expense.payment_mode || "-",
              formatCurrencyINR(expense.amount)
            ]
              .map((cell) => `<td>${escapeHtml(cell)}</td>`)
              .join("");
            return `<tr>${cells}</tr>`;
          })
          .join("")
      : `<tr><td colspan="5" style="text-align:center;color:#64748b;">No expenses in selected range</td></tr>`;

    const categoryRows = rangeCategoryDistribution.length
      ? rangeCategoryDistribution
          .map(
            (item) =>
              `<tr><td>${escapeHtml(item.category)}</td><td>${escapeHtml(formatCurrencyINR(item.total))}</td><td>${item.sharePercent.toFixed(1)}%</td></tr>`
          )
          .join("")
      : `<tr><td colspan="3" style="text-align:center;color:#64748b;">No category data</td></tr>`;

    const topMerchantRows = rangeTopMerchants.length
      ? rangeTopMerchants
          .map(
            (merchant) =>
              `<tr><td>${escapeHtml(merchant.merchant)}</td><td>${merchant.count}</td><td>${escapeHtml(formatCurrencyINR(merchant.totalAmount))}</td></tr>`
          )
          .join("")
      : `<tr><td colspan="3" style="text-align:center;color:#64748b;">No merchant data</td></tr>`;

    const reportWindow = window.open("", "_blank", "width=1200,height=900");
    if (!reportWindow) {
      setError("Unable to open PDF preview. Please allow popups and try again.");
      return;
    }

    const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${reportTitle}</title>
    <style>
      body { font-family: Arial, Helvetica, sans-serif; color: #0f172a; margin: 32px; }
      h1, h2, h3 { margin: 0; }
      .meta { margin-top: 8px; color: #334155; font-size: 12px; }
      .section { margin-top: 24px; }
      .cards { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
      .card { border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; }
      .label { font-size: 11px; color: #475569; text-transform: uppercase; }
      .value { font-size: 18px; margin-top: 5px; font-weight: 700; }
      table { border-collapse: collapse; width: 100%; margin-top: 10px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-size: 12px; }
      thead th { background: #e2e8f0; }
      .summary-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
      .footer { margin-top: 28px; font-size: 11px; color: #64748b; }
      @media print { body { margin: 14mm; } }
    </style>
  </head>
  <body>
    <header>
      <h1>${reportTitle}</h1>
      <p class="meta">Date Range: ${startDateLabel} to ${endDateLabel}</p>
    </header>
    <section class="section">
      <div class="cards">
        <div class="card"><div class="label">Total Spend</div><div class="value">${formatCurrencyINR(rangeTotal)}</div></div>
        <div class="card"><div class="label">Expense Count</div><div class="value">${filteredRangeExpenses.length}</div></div>
        <div class="card"><div class="label">Recurring Merchants</div><div class="value">${rangeRecurringMerchants.length}</div></div>
      </div>
    </section>
    <section class="section">
      <h2>Tabular Data</h2>
      <table>
        <thead>
          <tr><th>Date</th><th>Merchant</th><th>Category</th><th>Payment Mode</th><th>Amount</th></tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </section>
    <section class="section">
      <h2>Summary Section</h2>
      <div class="summary-grid">
        <div>
          <h3>Category Breakdown</h3>
          <table>
            <thead><tr><th>Category</th><th>Total</th><th>Share</th></tr></thead>
            <tbody>${categoryRows}</tbody>
          </table>
        </div>
        <div>
          <h3>Top Merchants</h3>
          <table>
            <thead><tr><th>Merchant</th><th>Visits</th><th>Total</th></tr></thead>
            <tbody>${topMerchantRows}</tbody>
          </table>
        </div>
      </div>
    </section>
    <p class="footer">Generated on ${new Date().toLocaleString("en-IN")}</p>
    <script>window.onload = function(){ window.print(); };</script>
  </body>
</html>`;

    reportWindow.document.open();
    reportWindow.document.write(html);
    reportWindow.document.close();
  };

  return (
    <div className="app-page-bg">
      <div className="app-page-shell">
        <section className="app-page-panel sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="app-page-eyebrow">Expense Management</p>
              <h1 className="app-page-title">Reports & Summaries</h1>
              <p className="app-page-subtitle sm:text-base">
                Generate monthly and date-range reports using the same analytics dataset.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
            <article className="rounded-2xl border border-[#2f4a78] bg-[#162746] p-5 shadow-[0_10px_24px_rgba(5,10,26,0.35)]">
              <p className="text-sm text-slate-400">This Month Total</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCurrencyINR(monthlyTotal)}</p>
              <p className={`mt-3 text-sm font-semibold ${monthComparison.percentChange >= 0 ? "text-rose-300" : "text-emerald-300"}`}>
                {monthComparison.percentChange >= 0 ? "UP" : "DOWN"} {Math.abs(monthComparison.percentChange).toFixed(1)}% vs last month
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
                onClick={handleDownloadReportPdf}
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

          <section className="mt-7 rounded-2xl border border-[#294673] bg-[#101f3c] p-5">
            <h2 className="text-lg font-semibold text-white">Summary Section</h2>
            <p className="mt-1 text-sm text-slate-400">Quick insights from the selected date range for fast financial review.</p>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <article className="rounded-xl border border-[#2f4a78] bg-[#162746] p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Total Expenses</p>
                <p className="mt-2 text-xl font-semibold text-white">{formatCurrencyINR(rangeTotal)}</p>
              </article>
              <article className="rounded-xl border border-[#2f4a78] bg-[#162746] p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Total Transactions</p>
                <p className="mt-2 text-xl font-semibold text-white">{filteredRangeExpenses.length}</p>
              </article>
              <article className="rounded-xl border border-[#2f4a78] bg-[#162746] p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-slate-400">Recurring Merchants</p>
                <p className="mt-2 text-xl font-semibold text-white">{rangeRecurringMerchants.length}</p>
              </article>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-2">
              <article className="rounded-xl border border-[#2f4a78] bg-[#162746] p-4">
                <h3 className="text-sm font-semibold text-slate-100">Top Categories</h3>
                {rangeCategoryDistribution.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">No category data for this range.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {rangeCategoryDistribution.slice(0, 5).map((item) => (
                      <div key={item.category} className="flex items-center justify-between text-sm">
                        <span className="text-slate-200">{item.category}</span>
                        <span className="text-slate-300">
                          {formatCurrencyINR(item.total)} ({item.sharePercent.toFixed(1)}%)
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </article>

              <article className="rounded-xl border border-[#2f4a78] bg-[#162746] p-4">
                <h3 className="text-sm font-semibold text-slate-100">Top Merchants</h3>
                {rangeTopMerchants.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">No merchant data for this range.</p>
                ) : (
                  <div className="mt-3 space-y-2">
                    {rangeTopMerchants.map((merchant) => (
                      <div key={merchant.merchant} className="flex items-center justify-between text-sm">
                        <span className="text-slate-200">{merchant.merchant}</span>
                        <span className="text-slate-300">
                          {merchant.count}x, {formatCurrencyINR(merchant.totalAmount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            </div>
          </section>

          {loading ? <p className="mt-4 text-sm text-slate-300">Loading reports...</p> : null}
          {error ? <p className="mt-4 text-sm text-rose-300">{error}</p> : null}
        </section>
      </div>
    </div>
  );
};

export default Reports;
