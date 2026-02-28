import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addManualExpense, getCategories, getExpenses } from "../../services/bills.service";
import { Category, CreateManualExpensePayload, Expense } from "../../types/bill";
import { formatDateDDMMYYYY } from "../../utils/formatDate";

const Expenses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    merchant: "",
    amount: "",
    category_id: "",
    expense_date: "",
    payment_mode: "",
    description: ""
  });
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const categoryNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach((category) => {
      map[category._id] = category.name;
    });
    return map;
  }, [categories]);

  const loadExpenses = async () => {
    setListLoading(true);
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load expenses");
    } finally {
      setListLoading(false);
    }
  };

  const loadCategories = async () => {
    setCategoriesLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load categories");
    } finally {
      setCategoriesLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    void Promise.all([loadExpenses(), loadCategories()]);
  }, [navigate]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "payment_mode" && paymentError) {
      setPaymentError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!form.payment_mode) {
      setPaymentError("Please select a payment option.");
      setLoading(false);
      return;
    }

    try {
      const payload: CreateManualExpensePayload = {
        merchant: form.merchant.trim(),
        amount: Number(form.amount),
        category_id: form.category_id,
        expense_date: new Date(`${form.expense_date}T00:00:00`).toISOString(),
        payment_mode: form.payment_mode.trim(),
        description: form.description.trim()
      };

      await addManualExpense(payload);
      setSuccess("Expense added successfully");
      setForm({
        merchant: "",
        amount: "",
        category_id: "",
        expense_date: "",
        payment_mode: "",
        description: ""
      });
      await loadExpenses();
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-emerald-100 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Manual Entry</p>
              <h1 className="text-2xl font-bold text-slate-900">Add Expense</h1>
              <p className="mt-2 text-sm text-slate-600">Create manual expense entries in your account.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate("/dashboard")} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Dashboard
              </button>
              <button type="button" onClick={() => navigate("/transactions")} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Transactions
              </button>
              <button type="button" onClick={handleLogout} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-medium text-white hover:bg-rose-700">
                Logout
              </button>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-4 text-sm text-emerald-600">{success}</p>}

          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="merchant" className="text-sm font-medium text-slate-700">Merchant Name</label>
              <input id="merchant" name="merchant" value={form.merchant} onChange={handleChange} placeholder="Merchant Name" className="border border-slate-300 rounded-lg px-3 py-2" required />
            </div>
            <input name="amount" value={form.amount} onChange={handleChange} type="number" min="0.01" step="0.01" placeholder="Amount" className="border border-slate-300 rounded-lg px-3 py-2 h-[42px] self-end" required />

            <div className="flex flex-col gap-1">
              <label htmlFor="category_id" className="text-sm font-medium text-slate-700">Category</label>
              <select
                id="category_id"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                className="border border-slate-300 rounded-lg px-3 py-2"
                disabled={categoriesLoading || categories.length === 0}
                required
              >
                <option value="">Select the category</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <input name="expense_date" value={form.expense_date} onChange={handleChange} type="date" className="border border-slate-300 rounded-lg px-3 py-2 h-[42px] self-end" required />
            <div className="flex flex-col gap-1">
              <label htmlFor="payment_mode" className="text-sm font-medium text-slate-700">
                Payment Mode
              </label>
              <select
                id="payment_mode"
                name="payment_mode"
                value={form.payment_mode}
                onChange={handleChange}
                className="border border-slate-300 rounded-lg px-3 py-2"
                required
              >
                <option value="">Select an option</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Others">Others</option>
              </select>
              {paymentError && <p className="text-xs text-red-600">{paymentError}</p>}
            </div>
            <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" className="border border-slate-300 rounded-lg px-3 py-2 md:col-span-2" required />
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={loading || categories.length === 0} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60">
                {loading ? "Saving..." : "Add Expense"}
              </button>
              <button type="button" onClick={() => navigate("/dashboard")} className="border border-slate-300 px-5 py-2.5 rounded-lg hover:bg-slate-100">
                Back
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-sky-100 backdrop-blur">
          <h2 className="text-xl font-semibold text-slate-900">Manual Expenses</h2>
          {listLoading ? <p className="mt-4 text-slate-500">Loading expenses...</p> : null}

          {!listLoading && expenses.length === 0 ? <p className="mt-4 text-slate-500">No expenses added yet.</p> : null}

          {expenses.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="text-left py-3">Date</th>
                    <th className="text-left py-3">Merchant</th>
                    <th className="text-left py-3">Category</th>
                    <th className="text-left py-3">Amount</th>
                    <th className="text-left py-3">Payment</th>
                    <th className="text-left py-3">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense._id} className="border-b border-slate-100">
                      <td className="py-3">{formatDateDDMMYYYY(expense.expense_date)}</td>
                      <td className="py-3">{expense.merchant}</td>
                      <td className="py-3">{categoryNameMap[expense.category_id] || "Unknown"}</td>
                      <td className="py-3">{expense.amount.toFixed(2)}</td>
                      <td className="py-3">{expense.payment_mode}</td>
                      <td className="py-3">{expense.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default Expenses;
