import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addManualExpense,
  confirmBill,
  getBillJobStatus,
  getCategories,
  getTaxRulesForFinancialYear,
  uploadBill
} from "../../services/bills.service";
import { Category, ConfirmBillPayload, ParsedReceiptData } from "../../types/bill";
import { formatDateDDMMYYYY, toInputDateValue } from "../../utils/formatDate";

type ManualFields = "merchant" | "amount" | "category_id" | "expense_date" | "payment_mode" | "description";

interface ParsedPreview {
  receiptId: string;
  imageUrl: string | null;
  parsedResult: ParsedReceiptData;
}

const normalize = (value: string): string =>
  value.trim().toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ");

const CATEGORY_ALIASES: Record<string, string> = {
  petrol: "fuel",
  diesel: "fuel",
  gasoline: "fuel",
  cng: "fuel",
  gas: "fuel",
  "fuel station": "fuel",
  "petrol pump": "fuel",
  "vehicle fuel": "fuel",
  "medical store": "medical",
  medicines: "medical",
  pharmacy: "medical",
  tuition: "education"
};

const matchCategoryId = (name: string, categories: Category[]): string => {
  if (!categories.length) return "";
  const parsed = normalize(name);
  const aliased = CATEGORY_ALIASES[parsed] || parsed;
  const exact = categories.find((category) => normalize(category.name) === parsed);
  if (exact) return exact._id;
  const aliasedExact = categories.find((category) => normalize(category.name) === aliased);
  if (aliasedExact) return aliasedExact._id;
  const partial = categories.find((category) => aliased.includes(normalize(category.name)) || normalize(category.name).includes(aliased));
  if (partial) return partial._id;
  const other = categories.find((category) => normalize(category.name) === "other");
  if (other) return other._id;
  return categories[0]._id;
};

const getFinancialYear = (value: string): string => {
  const parsed = value ? new Date(`${value}T00:00:00`) : new Date();
  const year = parsed.getFullYear();
  const start = parsed.getMonth() >= 3 ? year : year - 1;
  return `${start}-${start + 1}`;
};

const cardClass =
  "rounded-3xl border border-slate-700/80 bg-[linear-gradient(145deg,rgba(15,23,42,0.94),rgba(15,23,42,0.74))] p-6 shadow-[0_18px_40px_rgba(2,6,23,0.45)]";

const inputClass =
  "h-11 rounded-xl border border-slate-600 bg-slate-900/70 px-3 text-sm text-slate-100 outline-none transition focus:border-indigo-400";

const Expenses = () => {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const reloadTimerRef = useRef<number | null>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);

  const [manualLoading, setManualLoading] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);
  const [manualForm, setManualForm] = useState({
    merchant: "",
    amount: "",
    category_id: "",
    expense_date: "",
    payment_mode: "",
    description: ""
  });
  const [manualFieldErrors, setManualFieldErrors] = useState<Partial<Record<ManualFields, string>>>({});

  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [uploadPreview, setUploadPreview] = useState<ParsedPreview | null>(null);
  const [parsedForm, setParsedForm] = useState<ConfirmBillPayload>({ merchant: "", amount: 0, date: "", category_id: "" });
  const [confirming, setConfirming] = useState(false);
  const [taxEligible, setTaxEligible] = useState(false);
  const [confidence, setConfidence] = useState("0");
  const [topPopup, setTopPopup] = useState<{ type: "success" | "error"; message: string } | null>(null);

  useEffect(() => {
    return () => {
      if (reloadTimerRef.current) {
        window.clearTimeout(reloadTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    const load = async () => {
      setCategoriesLoading(true);
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (error: any) {
        setPageError(error?.response?.data?.message || "Failed to load categories");
      } finally {
        setCategoriesLoading(false);
      }
    };
    void load();
  }, [navigate]);

  useEffect(() => {
    if (!activeJobId) return;
    let cancelled = false;
    const pull = async () => {
      try {
        const job = await getBillJobStatus(activeJobId);
        if (cancelled) return;
        if (job.status === "FAILED") {
          setProcessing(false);
          setActiveJobId(null);
          setUploadStatus({ type: "error", message: "OCR processing failed." });
          return;
        }
        if (job.status === "COMPLETED" && job.extractedData) {
          const preview = {
            receiptId: job.extractedData.receiptId,
            imageUrl: job.extractedData.imageUrl,
            parsedResult: job.extractedData.parsedResult
          };
          const categoryId = matchCategoryId(preview.parsedResult.category || "Other", categories);
          setUploadPreview(preview);
          setConfidence(preview.parsedResult.confidence || "0");
          setParsedForm({
            merchant: preview.parsedResult.merchant || "",
            amount: preview.parsedResult.amount ?? 0,
            date: toInputDateValue(preview.parsedResult.date || ""),
            category_id: categoryId
          });
          setProcessing(false);
          setActiveJobId(null);
          setUploadStatus({ type: "success", message: "Bill processed successfully." });
        }
      } catch {
        if (cancelled) return;
        setProcessing(false);
        setActiveJobId(null);
        setUploadStatus({ type: "error", message: "OCR processing failed." });
      }
    };
    void pull();
    const id = window.setInterval(() => void pull(), 600);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [activeJobId, categories]);

  useEffect(() => {
    if (!parsedForm.date) return;
    const fy = getFinancialYear(parsedForm.date);
    void getTaxRulesForFinancialYear(fy)
      .then((rules) => {
        const selected = categories.find((item) => item._id === parsedForm.category_id)?.name?.trim().toLowerCase() || "";
        const eligible = rules
          .filter((rule) => rule.isActive)
          .some((rule) => rule.applicableCategories.some((name) => name.trim().toLowerCase() === selected));
        setTaxEligible(eligible);
      })
      .catch(() => setTaxEligible(false));
  }, [parsedForm.date, parsedForm.category_id, categories]);

  const isParsedValid = useMemo(
    () =>
      Boolean(uploadPreview?.receiptId) &&
      parsedForm.merchant.trim().length > 0 &&
      parsedForm.amount > 0 &&
      parsedForm.date.trim().length > 0 &&
      parsedForm.category_id.trim().length > 0,
    [parsedForm, uploadPreview?.receiptId]
  );

  const handleManualChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = event.target;
    setManualForm((prev) => ({ ...prev, [name]: value }));
    if (manualFieldErrors[name as ManualFields]) {
      setManualFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateManual = (): boolean => {
    const errors: Partial<Record<ManualFields, string>> = {};
    if (!manualForm.merchant.trim()) errors.merchant = "Merchant required.";
    if (!manualForm.amount.trim() || Number(manualForm.amount) <= 0) errors.amount = "Valid amount required.";
    if (!manualForm.category_id) errors.category_id = "Select category.";
    if (!manualForm.expense_date) errors.expense_date = "Select date.";
    if (!manualForm.payment_mode) errors.payment_mode = "Select payment mode.";
    if (!manualForm.description.trim()) errors.description = "Description required.";
    setManualFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleManualSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setManualError(null);
    setManualSuccess(null);
    if (!validateManual()) return;

    setManualLoading(true);
    try {
      await addManualExpense({
        merchant: manualForm.merchant.trim(),
        amount: Number(manualForm.amount),
        category_id: manualForm.category_id,
        expense_date: new Date(`${manualForm.expense_date}T00:00:00`).toISOString(),
        payment_mode: manualForm.payment_mode.trim(),
        description: manualForm.description.trim()
      });
      setManualSuccess("Manual expense saved.");
      setManualForm({ merchant: "", amount: "", category_id: "", expense_date: "", payment_mode: "", description: "" });
    } catch (error: any) {
      setManualError(error?.response?.data?.message || "Failed to save manual expense");
    } finally {
      setManualLoading(false);
    }
  };

  const handleUploadSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) {
      setUploadStatus({ type: "error", message: "Choose a file first." });
      return;
    }
    setUploading(true);
    setUploadStatus(null);
    setUploadPreview(null);
    try {
      const result = await uploadBill(file);
      setActiveJobId(result.jobId);
      setProcessing(true);
      setFile(null);
    } catch {
      setUploadStatus({ type: "error", message: "Upload failed." });
    } finally {
      setUploading(false);
    }
  };

  const handleSaveParsed = async () => {
    if (!uploadPreview?.receiptId || !isParsedValid) return;
    setConfirming(true);
    try {
      await confirmBill(uploadPreview.receiptId, {
        merchant: parsedForm.merchant.trim(),
        amount: parsedForm.amount,
        date: new Date(`${parsedForm.date}T00:00:00`).toISOString(),
        category_id: parsedForm.category_id
      });
      setUploadStatus({ type: "success", message: "Uploaded bill saved." });
      setTopPopup({ type: "success", message: "Parsed expense saved successfully. Refreshing..." });
      reloadTimerRef.current = window.setTimeout(() => {
        window.location.reload();
      }, 3000);
    } catch (error: any) {
      setUploadStatus({ type: "error", message: error?.response?.data?.message || "Failed to save uploaded bill." });
    } finally {
      setConfirming(false);
    }
  };

  const apiBaseUrl = ((import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL || "http://localhost:4000");

  return (
    <div className="app-page-bg">
      {topPopup ? (
        <div className="fixed left-1/2 top-5 z-50 w-[min(92vw,520px)] -translate-x-1/2">
          <div
            className={`rounded-xl border px-4 py-3 text-sm shadow-2xl ${
              topPopup.type === "success"
                ? "border-teal-400/60 bg-teal-500/15 text-teal-100"
                : "border-rose-400/60 bg-rose-500/15 text-rose-100"
            }`}
          >
            {topPopup.message}
          </div>
        </div>
      ) : null}
      <div className="app-page-shell">
        <section className="app-page-panel sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="app-page-eyebrow">Expense Manager</p>
              <h1 className="app-page-title">Unified Expense Hub</h1>
              <p className="app-page-subtitle">Upload bill and manual expense entry are now combined in one flow.</p>
            </div>
          </div>
          {pageError ? <p className="mt-4 text-sm text-rose-200">{pageError}</p> : null}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
          <article className={cardClass}>
            <h2 className="text-xl font-semibold text-indigo-200">Upload Bill</h2>
            <p className="mt-1 text-sm text-slate-300">OCR extraction with editable review before final save.</p>
            {uploadStatus ? (
              <p className={`mt-4 rounded-xl border px-3 py-2 text-sm ${uploadStatus.type === "success" ? "border-teal-400/50 bg-teal-500/10 text-teal-100" : "border-rose-400/50 bg-rose-500/10 text-rose-100"}`}>
                {uploadStatus.message}
              </p>
            ) : null}
            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              <div
                onDragOver={(event) => { event.preventDefault(); setIsDragActive(true); }}
                onDragLeave={(event) => { event.preventDefault(); setIsDragActive(false); }}
                onDrop={(event) => { event.preventDefault(); setIsDragActive(false); setFile(event.dataTransfer.files?.[0] || null); }}
                onClick={() => fileRef.current?.click()}
                className={`cursor-pointer rounded-2xl border border-dashed p-8 text-center transition ${isDragActive ? "border-indigo-300 bg-indigo-500/10" : "border-slate-600 bg-slate-900/50 hover:border-slate-500"}`}
              >
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/jpg,application/pdf" onChange={(event) => setFile(event.target.files?.[0] || null)} className="hidden" />
                <p className="text-sm font-medium">Drag bill here or click to browse</p>
                <p className="mt-1 text-xs text-slate-400">JPG, PNG, PDF</p>
                {file ? <p className="mt-2 text-xs text-teal-300">{file.name}</p> : null}
              </div>
              <button type="submit" disabled={uploading || processing} className="h-11 rounded-xl bg-indigo-500 px-5 text-sm font-semibold text-white disabled:opacity-70">
                {uploading || processing ? "Processing..." : "Upload & Parse"}
              </button>
              {processing ? <p className="text-xs text-slate-400">OCR is running. Clear, straight images with visible totals usually extract fastest and most accurately.</p> : null}
            </form>
          </article>

          <article className={cardClass}>
            <h2 className="text-xl font-semibold text-teal-200">Add Expense Manually</h2>
            <p className="mt-1 text-sm text-slate-300">Quick direct entry without uploading a bill.</p>
            {manualError ? <p className="mt-4 text-sm text-rose-200">{manualError}</p> : null}
            {manualSuccess ? <p className="mt-4 text-sm text-teal-200">{manualSuccess}</p> : null}
            <form onSubmit={handleManualSubmit} className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1"><label htmlFor="merchant" className="text-sm">Merchant</label><input id="merchant" name="merchant" value={manualForm.merchant} onChange={handleManualChange} className={inputClass} /><p className="text-xs text-rose-200">{manualFieldErrors.merchant || ""}</p></div>
              <div className="flex flex-col gap-1"><label htmlFor="amount" className="text-sm">Amount</label><input id="amount" name="amount" type="number" min="0.01" step="0.01" value={manualForm.amount} onChange={handleManualChange} className={inputClass} /><p className="text-xs text-rose-200">{manualFieldErrors.amount || ""}</p></div>
              <div className="flex flex-col gap-1">
                <label htmlFor="category_id" className="text-sm">Category</label>
                <select id="category_id" name="category_id" value={manualForm.category_id} onChange={handleManualChange} className={inputClass} disabled={categoriesLoading || categories.length === 0}>
                  <option value="">Select category</option>
                  {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                </select>
                <p className="text-xs text-rose-200">{manualFieldErrors.category_id || ""}</p>
              </div>
              <div className="flex flex-col gap-1"><label htmlFor="expense_date" className="text-sm">Date</label><input id="expense_date" name="expense_date" type="date" value={manualForm.expense_date} onChange={handleManualChange} className={inputClass} /><p className="text-xs text-rose-200">{manualFieldErrors.expense_date || ""}</p></div>
              <div className="flex flex-col gap-1">
                <label htmlFor="payment_mode" className="text-sm">Payment Mode</label>
                <select id="payment_mode" name="payment_mode" value={manualForm.payment_mode} onChange={handleManualChange} className={inputClass}>
                  <option value="">Select option</option><option value="Cash">Cash</option><option value="UPI">UPI</option><option value="Credit Card">Credit Card</option><option value="Debit Card">Debit Card</option><option value="Net Banking">Net Banking</option><option value="Bank Transfer">Bank Transfer</option><option value="Others">Others</option>
                </select>
                <p className="text-xs text-rose-200">{manualFieldErrors.payment_mode || ""}</p>
              </div>
              <div className="md:col-span-2 flex flex-col gap-1"><label htmlFor="description" className="text-sm">Description</label><textarea id="description" name="description" value={manualForm.description} onChange={handleManualChange} className="min-h-[90px] rounded-xl border border-slate-600 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400" /><p className="text-xs text-rose-200">{manualFieldErrors.description || ""}</p></div>
              <div className="md:col-span-2"><button type="submit" disabled={manualLoading || categories.length === 0} className="h-11 rounded-xl bg-teal-500 px-5 text-sm font-semibold text-slate-950 disabled:opacity-70">{manualLoading ? "Saving..." : "Save Manual Expense"}</button></div>
            </form>
          </article>
        </section>

        {uploadPreview ? (
          <section className={`mt-6 ${cardClass}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-xl font-semibold">Parsed Bill Review</h3>
              <div className="flex gap-2 text-xs">
                <span className="rounded-full border border-indigo-300/30 bg-indigo-500/10 px-3 py-1 text-indigo-100">Confidence: {confidence || "N/A"}</span>
                <span className={`rounded-full border px-3 py-1 ${taxEligible ? "border-teal-400/40 bg-teal-500/10 text-teal-100" : "border-slate-400/40 bg-slate-500/10 text-slate-200"}`}>Tax Eligible: {taxEligible ? "Yes" : "No"}</span>
              </div>
            </div>
            {uploadPreview.imageUrl ? <img src={`${apiBaseUrl}${uploadPreview.imageUrl}`} alt="Uploaded bill" className="mt-4 max-h-80 w-full rounded-2xl border border-slate-700 bg-slate-900/60 object-contain" /> : null}
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="flex flex-col gap-1"><label htmlFor="parsed-merchant" className="text-sm">Merchant</label><input id="parsed-merchant" type="text" value={parsedForm.merchant} onChange={(event) => setParsedForm((prev) => ({ ...prev, merchant: event.target.value }))} className={inputClass} /></div>
              <div className="flex flex-col gap-1"><label htmlFor="parsed-amount" className="text-sm">Amount</label><input id="parsed-amount" type="number" min="0.01" step="0.01" value={parsedForm.amount > 0 ? parsedForm.amount : ""} onChange={(event) => setParsedForm((prev) => ({ ...prev, amount: Number(event.target.value) || 0 }))} className={inputClass} /></div>
              <div className="flex flex-col gap-1"><label htmlFor="parsed-date" className="text-sm">Date</label><input id="parsed-date" type="date" value={parsedForm.date} onChange={(event) => setParsedForm((prev) => ({ ...prev, date: event.target.value }))} className={inputClass} /><p className="text-xs text-slate-400">Parsed: {parsedForm.date ? formatDateDDMMYYYY(parsedForm.date) : "N/A"}</p></div>
              <div className="flex flex-col gap-1">
                <label htmlFor="parsed-category" className="text-sm">Category</label>
                <select id="parsed-category" value={parsedForm.category_id} onChange={(event) => setParsedForm((prev) => ({ ...prev, category_id: event.target.value }))} className={inputClass}>
                  {categories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end"><button type="button" onClick={handleSaveParsed} disabled={!isParsedValid || confirming} className="h-11 rounded-xl bg-teal-500 px-5 text-sm font-semibold text-slate-950 disabled:opacity-70">{confirming ? "Saving..." : "Save Parsed Expense"}</button></div>
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default Expenses;
