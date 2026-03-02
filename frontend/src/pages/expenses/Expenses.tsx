import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addManualExpense, getCategories } from "../../services/bills.service";
import { Category, CreateManualExpensePayload } from "../../types/bill";
import addExpenseBg from "../../assets/add-expense-bg.png";

type FormFields = "merchant" | "amount" | "category_id" | "expense_date" | "payment_mode" | "description";

const Expenses = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
  const [focusedField, setFocusedField] = useState<FormFields | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FormFields, string>>>({});

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

    void loadCategories();
  }, [navigate]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "payment_mode" && paymentError) {
      setPaymentError(null);
    }
    if (fieldErrors[name as FormFields]) {
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = () => {
    const nextErrors: Partial<Record<FormFields, string>> = {};
    if (!form.merchant.trim()) nextErrors.merchant = "Merchant name is required.";
    if (!form.amount.trim() || Number(form.amount) <= 0) nextErrors.amount = "Enter a valid amount greater than 0.";
    if (!form.category_id) nextErrors.category_id = "Please select a category.";
    if (!form.expense_date) nextErrors.expense_date = "Please choose a date.";
    if (!form.payment_mode) nextErrors.payment_mode = "Please select a payment option.";
    if (!form.description.trim()) nextErrors.description = "Description is required.";
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      setPaymentError(!form.payment_mode ? "Please select a payment option." : null);
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
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to add expense");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-slate-100"
      style={{
        backgroundImage: `linear-gradient(120deg, rgba(15, 23, 42, 0.42), rgba(15, 23, 42, 0.2)), url(${addExpenseBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      <style>
        {`@keyframes expenseCardIn {
            0% { opacity: 0; transform: translateY(14px); }
            100% { opacity: 1; transform: translateY(0); }
          }`}
      </style>
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <section
          className="w-full rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-emerald-100 backdrop-blur"
          style={{ animation: "expenseCardIn 340ms ease-out" }}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">Expense Entry</p>
              <h1 className="text-2xl font-bold text-slate-900">Add Expense</h1>
              <p className="mt-2 text-sm text-slate-600">Create a new expense entry in your account.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate("/dashboard")} className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
                Dashboard
              </button>
              <button type="button" onClick={() => navigate("/transactions")} className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Transactions
              </button>
            </div>
          </div>

          {error && <p className="mt-4 text-sm text-red-600 transition-opacity duration-200">{error}</p>}
          {success && <p className="mt-4 text-sm text-emerald-600 transition-opacity duration-200">{success}</p>}

          <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="merchant" className={`text-sm font-medium transition-colors duration-200 ${focusedField === "merchant" ? "text-blue-600" : "text-slate-700"}`}>Merchant Name</label>
              <input
                id="merchant"
                name="merchant"
                value={form.merchant}
                onChange={handleChange}
                onFocus={() => setFocusedField("merchant")}
                onBlur={() => setFocusedField(null)}
                placeholder="Merchant Name"
                className={`border rounded-lg px-3 py-2 transition-all duration-200 ${fieldErrors.merchant ? "border-red-300 bg-red-50" : "border-slate-300"} focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none`}
                required
              />
              <p className={`text-xs text-red-600 transition-all duration-200 ${fieldErrors.merchant ? "max-h-8 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>{fieldErrors.merchant || ""}</p>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="amount" className={`text-sm font-medium transition-colors duration-200 ${focusedField === "amount" ? "text-blue-600" : "text-slate-700"}`}>Amount</label>
              <input
                id="amount"
                name="amount"
                value={form.amount}
                onChange={handleChange}
                onFocus={() => setFocusedField("amount")}
                onBlur={() => setFocusedField(null)}
                type="number"
                min="0.01"
                step="0.01"
                placeholder="Amount"
                className={`border rounded-lg px-3 py-2 h-[42px] transition-all duration-200 ${fieldErrors.amount ? "border-red-300 bg-red-50" : "border-slate-300"} focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none`}
                required
              />
              <p className={`text-xs text-red-600 transition-all duration-200 ${fieldErrors.amount ? "max-h-8 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>{fieldErrors.amount || ""}</p>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="category_id" className={`text-sm font-medium transition-colors duration-200 ${focusedField === "category_id" ? "text-blue-600" : "text-slate-700"}`}>Category</label>
              <select
                id="category_id"
                name="category_id"
                value={form.category_id}
                onChange={handleChange}
                onFocus={() => setFocusedField("category_id")}
                onBlur={() => setFocusedField(null)}
                className={`border rounded-lg px-3 py-2 transition-all duration-200 ${fieldErrors.category_id ? "border-red-300 bg-red-50" : "border-slate-300"} focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none`}
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
              <p className={`text-xs text-red-600 transition-all duration-200 ${fieldErrors.category_id ? "max-h-8 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>{fieldErrors.category_id || ""}</p>
            </div>

            <div className="flex flex-col gap-1">
              <label htmlFor="expense_date" className={`text-sm font-medium transition-colors duration-200 ${focusedField === "expense_date" ? "text-blue-600" : "text-slate-700"}`}>Date</label>
              <input
                id="expense_date"
                name="expense_date"
                value={form.expense_date}
                onChange={handleChange}
                onFocus={() => setFocusedField("expense_date")}
                onBlur={() => setFocusedField(null)}
                type="date"
                className={`border rounded-lg px-3 py-2 h-[42px] transition-all duration-200 ${fieldErrors.expense_date ? "border-red-300 bg-red-50" : "border-slate-300"} focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none`}
                required
              />
              <p className={`text-xs text-red-600 transition-all duration-200 ${fieldErrors.expense_date ? "max-h-8 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>{fieldErrors.expense_date || ""}</p>
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="payment_mode" className={`text-sm font-medium transition-colors duration-200 ${focusedField === "payment_mode" ? "text-blue-600" : "text-slate-700"}`}>
                Payment Mode
              </label>
              <select
                id="payment_mode"
                name="payment_mode"
                value={form.payment_mode}
                onChange={handleChange}
                onFocus={() => setFocusedField("payment_mode")}
                onBlur={() => setFocusedField(null)}
                className={`border rounded-lg px-3 py-2 transition-all duration-200 ${fieldErrors.payment_mode ? "border-red-300 bg-red-50" : "border-slate-300"} focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none`}
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
              <p className={`text-xs text-red-600 transition-all duration-200 ${paymentError || fieldErrors.payment_mode ? "max-h-8 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>
                {paymentError || fieldErrors.payment_mode || ""}
              </p>
            </div>
            <div className="md:col-span-2 flex flex-col gap-1">
              <label htmlFor="description" className={`text-sm font-medium transition-colors duration-200 ${focusedField === "description" ? "text-blue-600" : "text-slate-700"}`}>Description</label>
              <textarea
                id="description"
                name="description"
                value={form.description}
                onChange={handleChange}
                onFocus={() => setFocusedField("description")}
                onBlur={() => setFocusedField(null)}
                placeholder="Description"
                className={`border rounded-lg px-3 py-2 transition-all duration-200 ${fieldErrors.description ? "border-red-300 bg-red-50" : "border-slate-300"} focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none`}
                required
              />
              <p className={`text-xs text-red-600 transition-all duration-200 ${fieldErrors.description ? "max-h-8 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}>{fieldErrors.description || ""}</p>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" disabled={loading || categories.length === 0} className="bg-blue-600 text-white px-5 py-2.5 rounded-lg transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 disabled:opacity-60 disabled:translate-y-0">
                {loading ? "Saving..." : "Add Expense"}
              </button>
              <button type="button" onClick={() => navigate("/dashboard")} className="border border-slate-300 px-5 py-2.5 rounded-lg transition-colors duration-200 hover:bg-slate-100">
                Back
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
};

export default Expenses;
