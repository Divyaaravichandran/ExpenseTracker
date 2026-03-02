import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  confirmBill,
  getBillJobStatus,
  getCategories,
  getTaxRulesForFinancialYear,
  TaxRulePreview,
  uploadBill
} from "../../services/bills.service";
import { Category, ConfirmBillPayload, ConfirmBillResult, ParsedReceiptData } from "../../types/bill";
import { formatDateDDMMYYYY, toInputDateValue } from "../../utils/formatDate";
import uploadBillBg from "../../assets/upload-bill-bg.png";

const normalizeCategoryText = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ");

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

const matchCategoryId = (parsedCategoryName: string, categories: Category[]): string => {
  if (!categories.length) {
    return "";
  }

  const normalizedParsed = normalizeCategoryText(parsedCategoryName);
  const aliasedParsed = CATEGORY_ALIASES[normalizedParsed] || normalizedParsed;

  const fuelCategory = categories.find((category) => normalizeCategoryText(category.name) === "fuel");
  const fuelKeywords = ["fuel", "petrol", "diesel", "gasoline", "cng", "petrol pump", "fuel station"];
  if (fuelCategory && fuelKeywords.some((keyword) => aliasedParsed.includes(keyword))) {
    return fuelCategory._id;
  }

  const exact = categories.find((category) => category.name.trim().toLowerCase() === normalizedParsed);
  if (exact) {
    return exact._id;
  }

  const aliasedExact = categories.find((category) => normalizeCategoryText(category.name) === aliasedParsed);
  if (aliasedExact) {
    return aliasedExact._id;
  }

  const partial = categories.find((category) => {
    const normalizedCategory = normalizeCategoryText(category.name);
    return aliasedParsed.includes(normalizedCategory) || normalizedCategory.includes(aliasedParsed);
  });
  if (partial) {
    return partial._id;
  }

  const fallbackOther = categories.find((category) => category.name.trim().toLowerCase() === "other");
  if (fallbackOther) {
    return fallbackOther._id;
  }

  return categories[0]._id;
};

interface ParsedUploadPreview {
  receiptId: string;
  imageUrl: string | null;
  parsedResult: ParsedReceiptData;
}

const getFinancialYear = (value: string): string => {
  const parsedDate = value ? new Date(`${value}T00:00:00`) : new Date();
  const year = parsedDate.getFullYear();
  const month = parsedDate.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

const UploadBill = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<ParsedUploadPreview | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isJobProcessing, setIsJobProcessing] = useState(false);
  const [confirmResult, setConfirmResult] = useState<ConfirmBillResult | null>(null);
  const [saveAlertType, setSaveAlertType] = useState<"success" | "error" | null>(null);
  const [taxRules, setTaxRules] = useState<TaxRulePreview[]>([]);
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

  useEffect(() => {
    if (!activeJobId) {
      return;
    }

    let cancelled = false;

    const pullJobStatus = async () => {
      try {
        const job = await getBillJobStatus(activeJobId);

        if (cancelled) {
          return;
        }

        if (job.status === "FAILED") {
          setIsJobProcessing(false);
          setActiveJobId(null);
          setUploadStatus({
            type: "error",
            message: "Processing failed. Please try again."
          });
          return;
        }

        if (job.status === "COMPLETED" && job.extractedData) {
          const preview: ParsedUploadPreview = {
            receiptId: job.extractedData.receiptId,
            imageUrl: job.extractedData.imageUrl,
            parsedResult: job.extractedData.parsedResult
          };
          setUploadResult(preview);
          setConfidence(preview.parsedResult.confidence || "0");

          const categoryId = matchCategoryId(preview.parsedResult.category || "Other", categories);
          setParsedForm({
            merchant: preview.parsedResult.merchant || "",
            amount: preview.parsedResult.amount ?? 0,
            date: toInputDateValue(preview.parsedResult.date || ""),
            category_id: categoryId
          });

          setIsJobProcessing(false);
          setActiveJobId(null);
          setUploadStatus({
            type: "success",
            message: "Bill processed successfully."
          });
        }
      } catch (err: any) {
        if (cancelled) {
          return;
        }
        setIsJobProcessing(false);
        setActiveJobId(null);
        setUploadStatus({
          type: "error",
          message: "Processing failed. Please try again."
        });
      }
    };

    void pullJobStatus();
    const intervalId = window.setInterval(() => {
      void pullJobStatus();
    }, 1500);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [activeJobId, categories]);

  useEffect(() => {
    if (!uploadResult || parsedForm.category_id || categories.length === 0) {
      return;
    }

    const categoryId = matchCategoryId(uploadResult.parsedResult.category || "Other", categories);
    setParsedForm((prev) => ({ ...prev, category_id: categoryId }));
  }, [categories, parsedForm.category_id, uploadResult]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }

    const fy = getFinancialYear(parsedForm.date);
    void getTaxRulesForFinancialYear(fy)
      .then((rules) => setTaxRules(rules.filter((rule) => rule.isActive)))
      .catch(() => setTaxRules([]));
  }, [parsedForm.date]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!file) {
      setError("Please choose an image file");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    setUploadStatus(null);
    setSaveAlertType(null);
    setConfirmResult(null);
    setUploadResult(null);
    setActiveJobId(null);
    setIsJobProcessing(false);

    try {
      const response = await uploadBill(file);
      setActiveJobId(response.jobId);
      setIsJobProcessing(true);
      setFile(null);
    } catch (err: any) {
      setUploadStatus({
        type: "error",
        message: "Processing failed. Please try again."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilePick = (pickedFile: File | null) => {
    if (!pickedFile) {
      return;
    }
    setFile(pickedFile);
    setError(null);
    setSuccess(null);
    setUploadStatus(null);
    setSaveAlertType(null);
  };

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragActive(false);
    const droppedFile = event.dataTransfer.files?.[0] || null;
    handleFilePick(droppedFile);
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

  const selectedCategoryName = useMemo(() => {
    const selectedCategory = categories.find((category) => category._id === parsedForm.category_id);
    return selectedCategory?.name?.trim().toLowerCase() ?? "";
  }, [categories, parsedForm.category_id]);

  const previewMatchedTaxRule = useMemo(() => {
    if (!selectedCategoryName) {
      return null;
    }

    return (
      taxRules.find((rule) =>
        rule.applicableCategories.some((categoryName) => categoryName.trim().toLowerCase() === selectedCategoryName)
      ) ?? null
    );
  }, [selectedCategoryName, taxRules]);

  const isTaxEligible = confirmResult?.expense?.tax?.eligible ?? Boolean(previewMatchedTaxRule);

  const handleNext = async () => {
    if (!uploadResult?.receiptId) {
      setError(isJobProcessing ? "Bill is still processing. Please wait for completion." : "No uploaded receipt found. Please upload a bill first.");
      return;
    }

    if (!isParsedFormValid) {
      setError("Please complete parsed result fields before saving.");
      return;
    }

    setConfirming(true);
    setError(null);
    setSuccess(null);
    setUploadStatus(null);
    setSaveAlertType(null);

    try {
      const payload: ConfirmBillPayload = {
        merchant: parsedForm.merchant.trim(),
        amount: parsedForm.amount,
        date: new Date(`${parsedForm.date}T00:00:00`).toISOString(),
        category_id: parsedForm.category_id
      };

      const response = await confirmBill(uploadResult.receiptId, payload);
      setConfirmResult(response);
      setSuccess("Bill saved successfully.");
      setSaveAlertType("success");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to save bill");
      setSaveAlertType("error");
    } finally {
      setConfirming(false);
    }
  };

  const closeErrorAlert = () => {
    const shouldRefresh = saveAlertType === "error";
    setError(null);
    setSaveAlertType(null);
    if (shouldRefresh) {
      window.location.reload();
    }
  };

  const closeSuccessAlert = () => {
    const shouldRefresh = saveAlertType === "success";
    setSuccess(null);
    setSaveAlertType(null);
    if (shouldRefresh) {
      window.location.reload();
    }
  };

  const apiBaseUrl = ((import.meta as ImportMeta & { env: { VITE_API_URL?: string } }).env.VITE_API_URL ||
    "http://localhost:4000");

  return (
    <div
      className="min-h-screen bg-slate-100 font-sans"
      style={{
        fontFamily: "Inter, Poppins, sans-serif",
        backgroundImage: `linear-gradient(120deg, rgba(15,23,42,0.25), rgba(15,23,42,0.15)), url(${uploadBillBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed"
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <section className="w-full rounded-2xl border border-white/70 bg-white/70 p-5 shadow-[0_20px_60px_-20px_rgba(15,23,42,0.25)] backdrop-blur-xl sm:rounded-3xl sm:p-8">
          <style>
            {`@keyframes uploadStatusFadeIn {
                0% { opacity: 0; transform: translateY(-8px); }
                100% { opacity: 1; transform: translateY(0); }
              }`}
          </style>
          <div className="mb-6 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Expense Management</p>
              <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">Upload Your Bill</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
                Upload your receipt image and automatically extract expense details.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="rounded-xl border border-slate-300 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
              >
                Dashboard
              </button>
              <button
                type="button"
                onClick={() => navigate("/transactions")}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                Transactions
              </button>
            </div>
          </div>

          {uploadStatus ? (
            <div
              className={`mb-5 mt-1 flex items-start gap-2 rounded-2xl border border-l-4 px-4 py-3 text-sm shadow-sm ${
                uploadStatus.type === "success"
                  ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                  : "border-rose-300 bg-rose-50 text-rose-800"
              }`}
              style={{ animation: "uploadStatusFadeIn 240ms ease-out" }}
            >
              {uploadStatus.type === "success" ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 6 9 17l-5-5" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 9v4" />
                  <path d="M12 17h.01" />
                  <path d="M10.3 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.7 3.86a2 2 0 0 0-3.4 0z" />
                </svg>
              )}
              <span className="pt-0.5">{uploadStatus.message}</span>
              <button
                type="button"
                onClick={() => setUploadStatus(null)}
                className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md text-current/70 transition hover:bg-white/70 hover:text-current"
                aria-label="Close status message"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m18 6-12 12" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          ) : null}

          {error ? (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              <span>{error}</span>
              <button
                type="button"
                onClick={closeErrorAlert}
                className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md text-current/70 transition hover:bg-white/70 hover:text-current"
                aria-label="Close error message"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m18 6-12 12" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          ) : null}

          {success ? (
            <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <svg viewBox="0 0 24 24" className="h-5 w-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 6 9 17l-5-5" />
              </svg>
              <span>{success}</span>
              <button
                type="button"
                onClick={closeSuccessAlert}
                className="ml-auto inline-flex h-6 w-6 items-center justify-center rounded-md text-current/70 transition hover:bg-white/70 hover:text-current"
                aria-label="Close success message"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m18 6-12 12" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`group cursor-pointer rounded-2xl border-2 border-dashed bg-white/85 px-5 py-8 text-center transition-all sm:px-8 ${
                isDragActive ? "border-sky-500 bg-sky-50 shadow-inner" : "border-slate-300 hover:border-slate-400 hover:bg-white"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,application/pdf"
                onChange={(event) => handleFilePick(event.target.files?.[0] || null)}
                className="hidden"
              />
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-700 transition group-hover:bg-slate-200">
                <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <path d="M17 8 12 3 7 8" />
                  <path d="M12 3v12" />
                </svg>
              </div>
              <p className="text-base font-semibold text-slate-900 sm:text-lg">Drag & Drop your bill here or click to browse</p>
              <p className="mt-1 text-sm text-slate-500">Supported formats: JPG, PNG, PDF</p>
              {file ? <p className="mt-3 text-sm font-medium text-sky-700">Selected: {file.name}</p> : null}
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                type="submit"
                disabled={loading || isJobProcessing}
                className="inline-flex h-12 min-w-[210px] items-center justify-center rounded-xl bg-slate-900 px-6 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:translate-y-0 disabled:opacity-70"
              >
                {loading || isJobProcessing ? (
                  <>
                    <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                    {isJobProcessing ? "Processing OCR..." : "Uploading..."}
                  </>
                ) : (
                  "Upload & Process"
                )}
              </button>
              <button
                type="button"
                onClick={() => navigate("/dashboard")}
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                Back
              </button>
            </div>
          </form>

          {isJobProcessing ? (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-sky-300 border-t-sky-700" />
              <span>Processing bill in background. This page auto-refreshes the result every 1.5 seconds.</span>
            </div>
          ) : null}

          {uploadResult ? (
            <div className="mt-8 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-lg font-semibold text-slate-900">Parsed Bill Preview</h3>
                <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                  <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">Confidence: {confidence || "N/A"}</span>
                  <span
                    className={`rounded-full px-3 py-1 font-medium ${
                      isTaxEligible ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    Tax Eligible: {isTaxEligible ? "Yes" : "No"}
                  </span>
                </div>
              </div>

              {uploadResult.imageUrl ? (
                <img
                  src={`${apiBaseUrl}${uploadResult.imageUrl}`}
                  alt="Uploaded bill preview"
                  className="mb-5 max-h-72 w-full rounded-xl border border-slate-200 object-contain bg-slate-50"
                />
              ) : null}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <label htmlFor="merchant" className="text-sm font-medium text-slate-700">
                    Merchant Name
                  </label>
                  <input
                    id="merchant"
                    type="text"
                    value={parsedForm.merchant}
                    onChange={(event) => handleParsedChange("merchant", event.target.value)}
                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
                    onChange={(event) => handleParsedChange("amount", event.target.value)}
                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
                    onChange={(event) => handleParsedChange("date", event.target.value)}
                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
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
                    onChange={(event) => handleParsedChange("category_id", event.target.value)}
                    className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    disabled={categoriesLoading || categories.length === 0}
                  >
                    {categories.map((category) => (
                      <option key={category._id} value={category._id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isParsedFormValid || confirming}
                  className="inline-flex h-11 min-w-[160px] items-center justify-center rounded-xl bg-emerald-600 px-6 text-sm font-semibold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-65"
                >
                  {confirming ? (
                    <>
                      <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                      Saving...
                    </>
                  ) : (
                    "Save"
                  )}
                </button>
              </div>
            </div>
          ) : null}

        </section>
      </div>
    </div>
  );
};

export default UploadBill;
