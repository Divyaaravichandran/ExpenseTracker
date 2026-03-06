import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteExpense, getBills, getCategories, getExpenses } from "../../services/bills.service";
import { Category, Expense } from "../../types/bill";
import { formatCurrencyINR } from "../../utils/currency";
import { formatDateDDMMYYYY } from "../../utils/formatDate";
import { getCategoryDistribution, getMonthComparison } from "../../utils/analytics";

type TransactionFilter = "all" | "manual" | "uploaded";

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
  const monthComparison = useMemo(() => getMonthComparison(expenses), [expenses]);
  const topCategory = useMemo(() => getCategoryDistribution(filteredTransactions)[0], [filteredTransactions]);
  const taxEligibleCount = useMemo(
    () => filteredTransactions.filter((expense) => Boolean(expense.tax?.eligible)).length,
    [filteredTransactions]
  );
  const averageTxn = filteredTransactions.length > 0 ? totalAmount / filteredTransactions.length : 0;

  const handleDelete = async (expenseId: string) => {
    const shouldDelete = window.confirm("Delete this transaction?");
    if (!shouldDelete) return;

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
    <div className="app-page-bg">
      <div className="app-page-shell">
        <section className="app-page-panel sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="app-page-eyebrow">Expense Management</p>
              <h1 className="app-page-title">Transactions</h1>
              <p className="app-page-subtitle sm:text-base">
                Review all expense records with source and tax eligibility details.
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-[#2f4a78] bg-[#162746] p-5 shadow-[0_10px_24px_rgba(5,10,26,0.35)]">
              <p className="text-sm text-slate-400">Total Period Spend</p>
              <p className="mt-2 text-2xl font-semibold text-white">{formatCurrencyINR(totalAmount)}</p>
              <p className={`mt-3 text-sm font-semibold ${monthComparison.percentChange >= 0 ? "text-rose-300" : "text-emerald-300"}`}>
                {monthComparison.percentChange >= 0 ? "▲" : "▼"} {Math.abs(monthComparison.percentChange).toFixed(1)}% vs last month
              </p>
            </article>

            <article className="rounded-2xl border border-[#2f4a78] bg-[#162746] p-5 shadow-[0_10px_24px_rgba(5,10,26,0.35)]">
              <p className="text-sm text-slate-400">Top Category</p>
              <p className="mt-2 text-2xl font-semibold text-white">{topCategory?.category ?? "N/A"}</p>
              <p className="mt-3 text-sm text-slate-400">
                {topCategory ? `${topCategory.sharePercent.toFixed(0)}% of total expenses` : "No category data"}
              </p>
            </article>

            <article className="rounded-2xl border border-[#2f4a78] bg-[#162746] p-5 shadow-[0_10px_24px_rgba(5,10,26,0.35)]">
              <p className="text-sm text-slate-400">Transaction Count</p>
              <p className="mt-2 text-2xl font-semibold text-white">{filteredTransactions.length}</p>
              <p className="mt-3 text-sm font-semibold text-teal-300">Avg {formatCurrencyINR(averageTxn)}/txn</p>
            </article>

            <article className="rounded-2xl border border-teal-800/70 bg-[#162746] p-5 shadow-[0_10px_24px_rgba(5,10,26,0.35)]">
              <p className="text-sm text-slate-400">Tax Eligibility</p>
              <p className="mt-2 text-2xl font-semibold text-teal-300">{taxEligibleCount} items</p>
              <p className="mt-3 text-sm text-slate-400">Eligible for deduction</p>
            </article>
          </div>

          <section className="mt-7 overflow-hidden rounded-2xl border border-[#294673] bg-[#101f3c]">
            <div className="flex flex-col gap-4 border-b border-[#28436f] p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "all", label: "Show All Bills" },
                  { value: "manual", label: "Manually Added" },
                  { value: "uploaded", label: "Uploaded Data" }
                ].map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setActiveFilter(item.value as TransactionFilter)}
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                      activeFilter === item.value
                        ? "border-transparent bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-[0_8px_18px_rgba(99,102,241,0.35)]"
                        : "border-[#3b5b90] bg-[#112447] text-slate-300 hover:bg-[#1a335f]"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <p className="text-sm text-slate-400">
                Displaying <span className="font-semibold text-slate-200">{filteredTransactions.length}</span> transactions
              </p>
            </div>

            {loading ? <p className="p-4 text-sm text-slate-300">Loading transactions...</p> : null}
            {error ? <p className="p-4 text-sm text-rose-300">{error}</p> : null}
            {feedback ? <p className="p-4 text-sm text-emerald-300">{feedback}</p> : null}

            {!loading ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px]">
                  <thead>
                    <tr className="border-b border-[#28436f] bg-[#13284d] text-left text-[11px] uppercase tracking-[0.15em] text-slate-400">
                      <th className="px-5 py-3">Date</th>
                      <th className="px-5 py-3">Merchant</th>
                      <th className="px-5 py-3">Category</th>
                      <th className="px-5 py-3">Source</th>
                      <th className="px-5 py-3">Tax Eligibility</th>
                      <th className="px-5 py-3 text-right">Amount</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTransactions.map((expense) => {
                      const isTaxEligible = Boolean(expense.tax?.eligible);
                      const isUploaded = Boolean(expense.receipt_id);
                      return (
                        <tr key={expense._id} className="border-b border-[#213a62] text-sm text-slate-200 hover:bg-[#19315a]">
                          <td className="px-5 py-4 text-slate-300">{formatDateDDMMYYYY(expense.expense_date)}</td>
                          <td className="px-5 py-4 font-semibold text-white">{expense.merchant}</td>
                          <td className="px-5 py-4">{expense.category?.name ?? categoryNameMap[expense.category_id] ?? "Unknown"}</td>
                          <td className="px-5 py-4 italic text-slate-500">{isUploaded ? "Uploaded Bill" : "Manual Entry"}</td>
                          <td className="px-5 py-4">
                            <span
                              className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${
                                isTaxEligible
                                  ? "border-teal-700/55 bg-teal-900/25 text-teal-300"
                                  : "border-rose-700/55 bg-rose-900/20 text-rose-300"
                              }`}
                            >
                              {isTaxEligible ? "Tax Eligible" : "Not Tax Eligible"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right font-semibold text-white">{formatCurrencyINR(expense.amount)}</td>
                          <td className="px-5 py-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDelete(expense._id)}
                              disabled={deletingExpenseId === expense._id}
                              className="text-xs font-semibold uppercase tracking-[0.08em] text-rose-500 transition hover:text-rose-400 disabled:opacity-60"
                            >
                              {deletingExpenseId === expense._id ? "Deleting..." : "Delete"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                    {!loading && filteredTransactions.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-400">
                          No transactions found for the selected filter.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>

          <p className="mt-4 text-xs text-slate-500">Total uploaded bills in account: {billsCount}</p>
        </section>
      </div>
    </div>
  );
};

export default Transactions;
