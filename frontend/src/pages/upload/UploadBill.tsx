import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { confirmBill, getCategories, uploadBill } from "../../services/bills.service";
import { Category, ConfirmBillPayload, ConfirmBillResult, UploadBillResult } from "../../types/bill";
import { formatDateDDMMYYYY, toInputDateValue } from "../../utils/formatDate";

const matchCategoryId = (parsedCategoryName: string, categories: Category[]): string => {
  if (!categories.length) {
    return "";
  }

  const normalizedParsed = parsedCategoryName.trim().toLowerCase();
  const exact = categories.find((category) => category.name.trim().toLowerCase() === normalizedParsed);
  if (exact) {
    return exact._id;
  }

  const fallbackOther = categories.find((category) => category.name.trim().toLowerCase() === "other");
  if (fallbackOther) {
    return fallbackOther._id;
  }

  return categories[0]._id;
};

const UploadBill = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadBillResult | null>(null);
  const [confirmResult, setConfirmResult] = useState<ConfirmBillResult | null>(null);
  const [parsedForm, setParsedForm] = useState<ConfirmBillPayload>({
    merchant: "",
    amount: 0,
    date: "",
    category_id: ""
  });
  const [confidence, setConfidence] = useState<string>("0");

  const loadCategories = async (): Promise<Category[]> => {
    setCategoriesLoading(true);
    try {
      const data = await getCategories();
      setCategories(data);
      return data;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load categories");
      return [];
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

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setError("Please choose an image file");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setConfirmResult(null);

    try {
      const response = await uploadBill(file);
      setUploadResult(response);
      setConfidence(response.parsedResult.confidence || "0");

      const latestCategories = categories.length > 0 ? categories : await loadCategories();
      const categoryId = matchCategoryId(response.parsedResult.category || "Other", latestCategories);

      setParsedForm({
        merchant: response.parsedResult.merchant || "",
        amount: response.parsedResult.amount ?? 0,
        date: toInputDateValue(response.parsedResult.date || ""),
        category_id: categoryId
      });

      setSuccess("Bill parsed. Review and click Next to save.");
      setFile(null);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to upload bill");
    } finally {
      setLoading(false);
    }
  };

  const handleParsedChange = (field: keyof ConfirmBillPayload, value: string) => {
    setParsedForm((prev) => {
      if (field === "amount") {
        const amount = Number(value);
        return { ...prev, amount: Number.isFinite(amount) ? amount : 0 };
      }

      return { ...prev, [field]: value };
    });
  };

  const isParsedFormValid = useMemo(() => {
    return (
      Boolean(uploadResult?.receiptId) &&
      parsedForm.merchant.trim().length > 0 &&
      parsedForm.amount > 0 &&
      parsedForm.date.trim().length > 0 &&
      parsedForm.category_id.trim().length > 0
    );
  }, [parsedForm, uploadResult?.receiptId]);

  const handleNext = async () => {
    if (!uploadResult?.receiptId) {
      setError("No uploaded receipt found. Please upload a bill first.");
      return;
    }

    if (!isParsedFormValid) {
      setError("Please complete parsed result fields before saving.");
      return;
    }

    setConfirming(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: ConfirmBillPayload = {
        merchant: parsedForm.merchant.trim(),
        amount: parsedForm.amount,
        date: new Date(`${parsedForm.date}T00:00:00`).toISOString(),
        category_id: parsedForm.category_id
      };

      const response = await confirmBill(uploadResult.receiptId, payload);
      setConfirmResult(response);
      setSuccess("Bill saved successfully. Refreshing...");

      setTimeout(() => {
        window.location.reload();
      }, 900);
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save bill");
    } finally {
      setConfirming(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  const apiBaseUrl = ((import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL ||
    "http://localhost:4000");

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-emerald-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-emerald-100 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-emerald-600">Expense Management</p>
              <h1 className="text-2xl font-bold text-slate-900">Upload Bill</h1>
              <p className="mt-2 text-sm text-slate-600">Upload a receipt image, review parsed details, and save as transaction.</p>
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
                onClick={() => navigate("/transactions")}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
              >
                Transactions
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

          {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
          {success ? <p className="mt-4 text-sm text-emerald-600">{success}</p> : null}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="block w-full text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-5 py-2.5 text-white hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Uploading..." : "Upload Bill"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-lg border border-slate-300 px-5 py-2.5 hover:bg-slate-100"
              >
                Back
              </button>
            </div>
          </form>

          {uploadResult ? (
            <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
              <h3 className="text-lg font-semibold text-slate-900">Parsed Result</h3>

              {uploadResult.imageUrl ? (
                <img src={`${apiBaseUrl}${uploadResult.imageUrl}`} alt="Uploaded bill" className="max-h-64 rounded-lg border border-slate-200" />
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="merchant" className="text-sm font-medium text-slate-700">
                    Merchant
                  </label>
                  <input
                    id="merchant"
                    type="text"
                    value={parsedForm.merchant}
                    onChange={(e) => handleParsedChange("merchant", e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="amount" className="text-sm font-medium text-slate-700">
                    Amount
                  </label>
                  <input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={parsedForm.amount > 0 ? parsedForm.amount : ""}
                    onChange={(e) => handleParsedChange("amount", e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="expense-date" className="text-sm font-medium text-slate-700">
                    Date
                  </label>
                  <input
                    id="expense-date"
                    type="date"
                    value={parsedForm.date}
                    onChange={(e) => handleParsedChange("date", e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                  />
                  <p className="text-xs text-slate-500">Parsed: {parsedForm.date ? formatDateDDMMYYYY(parsedForm.date) : "N/A"}</p>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="category" className="text-sm font-medium text-slate-700">
                    Category
                  </label>
                  <select
                    id="category"
                    value={parsedForm.category_id}
                    onChange={(e) => handleParsedChange("category_id", e.target.value)}
                    className="rounded-lg border border-slate-300 px-3 py-2"
                    disabled={categoriesLoading || categories.length === 0}
                  >
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1 md:col-span-2">
                  <label htmlFor="confidence" className="text-sm font-medium text-slate-700">
                    Confidence
                  </label>
                  <input
                    id="confidence"
                    type="text"
                    value={confidence}
                    readOnly
                    className="rounded-lg border border-slate-300 bg-slate-100 px-3 py-2 text-slate-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isParsedFormValid || confirming}
                  className="rounded-lg bg-emerald-600 px-5 py-2.5 text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {confirming ? "Saving..." : "Next"}
                </button>
              </div>
            </div>
          ) : null}

          {confirmResult ? (
            <div className="mt-6 space-y-2 rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-lg font-semibold text-slate-900">Saved Result</h3>
              <p className="text-slate-700">Merchant: {confirmResult.parsedResult?.merchant ?? "N/A"}</p>
              <p className="text-slate-700">Amount: {confirmResult.parsedResult?.amount ?? "N/A"}</p>
              <p className="text-slate-700">
                Date: {confirmResult.parsedResult?.date ? formatDateDDMMYYYY(confirmResult.parsedResult.date) : "N/A"}
              </p>
              <p className="text-slate-700">Category: {confirmResult.parsedResult?.category ?? "N/A"}</p>
              <p className="text-slate-700">Confidence: {confirmResult.parsedResult?.confidence ?? "N/A"}</p>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
};

export default UploadBill;
