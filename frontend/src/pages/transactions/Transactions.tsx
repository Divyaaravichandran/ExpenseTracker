import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteExpense, getCategories, getExpenses } from "../../services/bills.service";
import { Category, Expense } from "../../types/bill";
import { formatCurrencyINR } from "../../utils/currency";
import { formatDateDDMMYYYY } from "../../utils/formatDate";

type TransactionFilter = "all" | "manual" | "uploaded";

const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
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
        const [expenseList, categoryList] = await Promise.all([getExpenses(), getCategories()]);
        setExpenses(expenseList);
        setCategories(categoryList);
      } catch (loadError: any) {
        setExpenses([]);
        setCategories([]);
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    navigate("/login", { replace: true });
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
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700"
              >
                Logout
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
      </div>
    </div>
  );
};

export default Transactions;
