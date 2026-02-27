import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { confirmBill, getBills, getCategories, uploadBill } from "../../services/bills.service";
import { Category, ConfirmBillPayload, ConfirmBillResult, Receipt, UploadBillResult } from "../../types/bill";
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
  const [bills, setBills] = useState<Receipt[]>([]);
  const [listLoading, setListLoading] = useState(false);
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

  const loadBills = async (): Promise<Receipt[]> => {
    setListLoading(true);
    try {
      const data = await getBills();
      setBills(data);
      return data;
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load bills");
      return [];
    } finally {
      setListLoading(false);
    }
  };

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

    void Promise.all([loadBills(), loadCategories()]);
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
    return Boolean(uploadResult?.receiptId) && parsedForm.merchant.trim().length > 0 && parsedForm.amount > 0 && parsedForm.date.trim().length > 0 && parsedForm.category_id.trim().length > 0;
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
      const refreshedBills = await loadBills();
      const confirmedReceipt = refreshedBills.find((bill) => bill._id === uploadResult.receiptId);
      const parsedResult = response.parsedResult ?? confirmedReceipt?.parsedData ?? undefined;

      if (!parsedResult) {
        setError("Saving finished, but parsed result is missing in response.");
        return;
      }

      setConfirmResult({ ...response, parsedResult });
      setSuccess("Bill saved successfully.");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save bill");
    } finally {
      setConfirming(false);
    }
  };

  const apiBaseUrl = ((import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL || "http://localhost:4000");

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Upload Bill</h1>
          <p className="text-slate-600 mt-2">Upload receipt image and store it in your account.</p>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {success && <p className="mt-4 text-sm text-emerald-600">{success}</p>}

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
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Uploading..." : "Upload Bill"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="border border-slate-300 px-5 py-2.5 rounded-lg hover:bg-slate-100"
              >
                Back
              </button>
            </div>
          </form>

          {uploadResult ? (
            <div className="mt-6 rounded-xl border border-slate-200 p-4 space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Parsed Result</h3>

              {uploadResult.imageUrl ? (
                <img
                  src={`${apiBaseUrl}${uploadResult.imageUrl}`}
                  alt="Uploaded bill"
                  className="max-h-64 rounded-lg border border-slate-200"
                />
              ) : null}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label htmlFor="merchant" className="text-sm font-medium text-slate-700">Merchant</label>
                  <input
                    id="merchant"
                    type="text"
                    value={parsedForm.merchant}
                    onChange={(e) => handleParsedChange("merchant", e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="amount" className="text-sm font-medium text-slate-700">Amount</label>
                  <input
                    id="amount"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={parsedForm.amount > 0 ? parsedForm.amount : ""}
                    onChange={(e) => handleParsedChange("amount", e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="expense-date" className="text-sm font-medium text-slate-700">Date</label>
                  <input
                    id="expense-date"
                    type="date"
                    value={parsedForm.date}
                    onChange={(e) => handleParsedChange("date", e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2"
                  />
                  <p className="text-xs text-slate-500">
                    Parsed: {parsedForm.date ? formatDateDDMMYYYY(parsedForm.date) : "N/A"}
                  </p>
                </div>

                <div className="flex flex-col gap-1">
                  <label htmlFor="category" className="text-sm font-medium text-slate-700">Category</label>
                  <select
                    id="category"
                    value={parsedForm.category_id}
                    onChange={(e) => handleParsedChange("category_id", e.target.value)}
                    className="border border-slate-300 rounded-lg px-3 py-2"
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
                  <label htmlFor="confidence" className="text-sm font-medium text-slate-700">Confidence</label>
                  <input
                    id="confidence"
                    type="text"
                    value={confidence}
                    readOnly
                    className="border border-slate-300 rounded-lg px-3 py-2 bg-slate-100 text-slate-600"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isParsedFormValid || confirming}
                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 disabled:opacity-60"
                >
                  {confirming ? "Saving..." : "Next"}
                </button>
              </div>
            </div>
          ) : null}

          {confirmResult ? (
            <div className="mt-6 rounded-xl border border-slate-200 p-4 space-y-2">
              <h3 className="text-lg font-semibold text-slate-900">Saved Result</h3>
              <p className="text-slate-700">Merchant: {confirmResult.parsedResult?.merchant ?? "N/A"}</p>
              <p className="text-slate-700">Amount: {confirmResult.parsedResult?.amount ?? "N/A"}</p>
              <p className="text-slate-700">Date: {confirmResult.parsedResult?.date ? formatDateDDMMYYYY(confirmResult.parsedResult.date) : "N/A"}</p>
              <p className="text-slate-700">Category: {confirmResult.parsedResult?.category ?? "N/A"}</p>
              <p className="text-slate-700">Confidence: {confirmResult.parsedResult?.confidence ?? "N/A"}</p>
            </div>
          ) : null}
        </section>

        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Show All Bills</h2>
          {listLoading ? <p className="mt-4 text-slate-500">Loading bills...</p> : null}

          {!listLoading && bills.length === 0 ? <p className="mt-4 text-slate-500">No bills uploaded yet.</p> : null}

          {bills.length > 0 ? (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500">
                    <th className="text-left py-3">Uploaded At</th>
                    <th className="text-left py-3">Status</th>
                    <th className="text-left py-3">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {bills.map((bill) => (
                    <tr key={bill._id} className="border-b border-slate-100">
                      <td className="py-3 text-slate-800">{formatDateDDMMYYYY(bill.uploadedAt)}</td>
                      <td className="py-3 text-slate-800">{bill.status}</td>
                      <td className="py-3">
                        {bill.imageUrl ? (
                          <a href={`${apiBaseUrl}${bill.imageUrl}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                            View Image
                          </a>
                        ) : (
                          <span className="text-slate-500">N/A</span>
                        )}
                      </td>
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

export default UploadBill;
