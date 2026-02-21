import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteExpense, getBills, getExpenses } from "../../services/bills.service";
import { Expense } from "../../types/bill";

export const Dashboard = () => {
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [billsCount, setBillsCount] = useState(0);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
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

    loadData();
  }, [navigate]);

  const totalExpenses = useMemo(() => expenses.reduce((sum, expense) => sum + expense.amount, 0), [expenses]);

  const thisMonthTotal = useMemo(() => {
    const now = new Date();
    return expenses
      .filter((expense) => {
        const date = new Date(expense.expense_date);
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const transactions = showAllTransactions ? expenses : expenses.slice(0, 15);

  const incomeTotal = useMemo(
    () => expenses.reduce((sum, expense) => (expense.category?.name === "Income" ? sum + expense.amount : sum), 0),
    [expenses]
  );

  const savedTotal = useMemo(() => Math.max(incomeTotal - totalExpenses, 0), [incomeTotal, totalExpenses]);

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
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-7xl mx-auto px-6 py-10">
        <section className="mb-8 flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-sm"
            aria-label="Go back"
          >
            <span className="text-lg">&larr;</span>
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-slate-500 mt-1 text-lg">Here&apos;s your expense overview.</p>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-md mb-10">
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Quick Actions</h2>
          <p className="text-slate-500 text-sm mb-6">Common tasks to manage your expenses</p>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/upload")}
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-3 rounded-xl hover:from-blue-600 hover:to-indigo-600 transition-all duration-300 shadow-md hover:shadow-lg font-medium"
            >
              Upload Bill
            </button>
            <button
              onClick={() => navigate("/expenses")}
              className="bg-white border-2 border-slate-300 text-slate-700 px-6 py-3 rounded-xl hover:border-blue-500 hover:text-blue-600 transition-all duration-300 font-medium"
            >
              Add Expense
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="h-2 w-2 rounded-full bg-blue-500" />
                Expenses
              </span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-slate-900">${totalExpenses.toFixed(2)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Income
              </span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-slate-900">${incomeTotal.toFixed(2)}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                Saved
              </span>
            </div>
            <p className="text-3xl md:text-4xl font-bold text-slate-900">${savedTotal.toFixed(2)}</p>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md mb-10">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Recent Transactions</h2>
              <p className="text-slate-500 text-sm mt-1">Your latest expense entries</p>
            </div>
            <button onClick={() => setShowAllTransactions((prev) => !prev)} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              {showAllTransactions ? "Show Less" : "View All"}
            </button>
          </div>
          {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
          {feedback ? <p className="mb-4 text-sm text-emerald-600">{feedback}</p> : null}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-slate-500 border-b border-slate-200">
                  <th className="text-left py-4 px-4 font-semibold text-sm">Date</th>
                  <th className="text-left py-4 px-4 font-semibold text-sm">Merchant</th>
                  <th className="text-left py-4 px-4 font-semibold text-sm">Category</th>
                  <th className="text-right py-4 px-4 font-semibold text-sm">Amount</th>
                  <th className="text-right py-4 px-4 font-semibold text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((transaction) => (
                  <tr key={transaction._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150">
                    <td className="py-4 px-4 text-slate-700">{new Date(transaction.expense_date).toLocaleDateString()}</td>
                    <td className="py-4 px-4">
                      <span className="font-medium text-slate-900">{transaction.merchant}</span>
                    </td>
                    <td className="py-4 px-4 text-slate-700">{transaction.category?.name ?? "Unknown"}</td>
                    <td className="py-4 px-4 text-right font-semibold text-slate-900">${transaction.amount.toFixed(2)}</td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleDelete(transaction._id)}
                        disabled={deletingExpenseId === transaction._id}
                        className="text-red-600 hover:text-red-700 disabled:opacity-60 font-medium text-sm"
                      >
                        {deletingExpenseId === transaction._id ? "Deleting..." : "Delete"}
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 ? (
                  <tr>
                    <td className="py-6 px-4 text-slate-500" colSpan={5}>
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
