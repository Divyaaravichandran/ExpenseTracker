import React, { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";
import { useNavigate } from "react-router-dom";
import {
  getTaxSectionExpenses,
  getTaxSummary,
  getTaxTimeline,
  TaxSectionExpenseItem,
  TaxSectionSummary,
  TaxSummaryResponse,
  TaxTimelinePoint
} from "../../services/reports.service";
import { formatDateDDMMYYYY } from "../../utils/formatDate";

const BRAND_BLUE = "#818CF8";

const getFinancialYear = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

const getFinancialYearOptions = (count: number): string[] => {
  const currentStartYear = Number(getFinancialYear(new Date()).split("-")[0]);
  return Array.from({ length: count }).map((_, index) => {
    const startYear = currentStartYear - index;
    return `${startYear}-${startYear + 1}`;
  });
};

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2
  }).format(amount);

interface ApiErrorResponse {
  message?: string;
}

interface SectionCardProps {
  section: TaxSectionSummary;
  isActive: boolean;
  onClick: (sectionCode: string) => void;
}

const SectionCard: React.FC<SectionCardProps> = ({ section, isActive, onClick }) => {
  return (
    <button
      type="button"
      onClick={() => onClick(section.section)}
      className={`rounded-2xl border p-5 text-left transition ${
        isActive
          ? "border-cyan-500/60 bg-[#17305a] shadow-[0_12px_28px_rgba(56,189,248,0.18)]"
          : "border-[#2f4a78] bg-[#162746] hover:border-indigo-400/60"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-white">Section {section.section}</h2>
          <p className="text-sm text-slate-400">{section.title}</p>
        </div>
        <span className="rounded-full border border-[#3a5a90] bg-[#112447] px-2 py-0.5 text-[11px] text-slate-300">
          {section.utilizationPercent.toFixed(0)}% utilized
        </span>
      </div>

      <div className="mt-4 space-y-1.5 text-sm text-slate-300">
        <p>
          Total Spent: <span className="font-medium text-white">{formatCurrency(section.totalSpent)}</span>
        </p>
        <p>
          Max Limit: <span className="font-medium text-white">{formatCurrency(section.maxLimit)}</span>
        </p>
        <p>
          Remaining Amount: <span className="font-medium text-white">{formatCurrency(section.remainingEligible)}</span>
        </p>
      </div>

      <div className="mt-4 h-1.5 w-full rounded-full bg-[#0f1f3f]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ backgroundColor: BRAND_BLUE, width: `${Math.min(section.utilizationPercent, 100)}%` }}
        />
      </div>
    </button>
  );
};

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-[#1a315a] ${className}`} />
);

const SectionPieChart: React.FC<{ sections: TaxSectionSummary[] }> = ({ sections }) => {
  const total = sections.reduce((sum, section) => sum + section.totalSpent, 0);
  const palette = [BRAND_BLUE, "#0F766E", "#64748B", "#93C5FD", "#99F6E4", "#CBD5E1", "#1D4ED8"];
  const slices = sections.map((section, index) => ({
    ...section,
    color: palette[index % palette.length],
    value: total > 0 ? (section.totalSpent / total) * 100 : 0
  }));

  let cursor = 0;
  const gradientParts = slices.map((slice) => {
    const start = cursor;
    const end = cursor + slice.value;
    cursor = end;
    return `${slice.color} ${start}% ${end}%`;
  });

  return (
    <div className="rounded-2xl border border-[#2f4a78] bg-[#162746] p-6">
      <h3 className="text-sm font-semibold text-slate-200">Spend by Section</h3>
      <div className="mt-5 flex flex-col items-center gap-5 md:flex-row md:items-start">
        <div className="relative h-44 w-44">
          <div
            className="h-44 w-44 rounded-full"
            style={{
              background: gradientParts.length > 0 ? `conic-gradient(${gradientParts.join(", ")})` : "#1f3761"
            }}
          />
          <div className="absolute inset-[24%] rounded-full bg-[#0f1f3f] shadow-inner" />
        </div>
        <div className="w-full space-y-2">
          {slices.map((slice) => (
            <div key={slice.section} className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 text-slate-300">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                {slice.section}
              </span>
              <span className="font-medium text-white">{slice.value.toFixed(1)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const UtilizationTimelineChart: React.FC<{ timeline: TaxTimelinePoint[] }> = ({ timeline }) => {
  const maxSpent = Math.max(...timeline.map((item) => item.totalSpent), 0);

  return (
    <div className="rounded-2xl border border-[#2f4a78] bg-[#162746] p-6">
      <h3 className="text-sm font-semibold text-slate-200">Utilization Over Time</h3>
      <div className="mt-5 space-y-3">
        {timeline.length === 0 ? <p className="text-sm text-slate-400">No timeline data yet.</p> : null}
        {timeline.map((item) => {
          const width = maxSpent > 0 ? (item.totalSpent / maxSpent) * 100 : 0;
          return (
            <div key={item.month} className="grid grid-cols-[70px_1fr_95px] items-center gap-2 text-sm sm:grid-cols-[80px_1fr_120px] sm:gap-3">
              <span className="text-slate-300">{item.month}</span>
              <div className="h-1.5 rounded-full bg-[#0f1f3f]">
                <div className="h-full rounded-full" style={{ backgroundColor: BRAND_BLUE, width: `${Math.max(width, 2)}%` }} />
              </div>
              <span className="text-right font-medium text-white">{formatCurrency(item.totalSpent)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const downloadCsv = (filename: string, rows: string[][]): void => {
  const csvContent = rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replace(/"/g, "\"\"")}"`)
        .join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const TaxSummaryPage: React.FC = () => {
  const navigate = useNavigate();
  const [year, setYear] = useState<string>(getFinancialYear(new Date()));
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [summary, setSummary] = useState<TaxSummaryResponse | null>(null);
  const [timeline, setTimeline] = useState<TaxTimelinePoint[]>([]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [sectionExpenses, setSectionExpenses] = useState<TaxSectionExpenseItem[]>([]);
  const [sectionLoading, setSectionLoading] = useState<boolean>(false);
  const [sectionError, setSectionError] = useState<string | null>(null);

  const yearOptions = useMemo(() => getFinancialYearOptions(6), []);
  const sections = summary?.sections ?? [];
  const sectionsUsed = sections.length;
  const remainingPossibleSavings = useMemo(
    () => sections.reduce((sum, section) => sum + section.remainingEligible, 0),
    [sections]
  );

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const loadSummary = async () => {
      setLoading(true);
      setError(null);
      setWarning(null);
      setSelectedSection(null);
      setSectionExpenses([]);
      setSectionError(null);

      try {
        const [summaryResponse, timelineResponse] = await Promise.all([getTaxSummary(year), getTaxTimeline(year)]);
        const data = summaryResponse;
        setSummary(data);
        setTimeline(timelineResponse.timeline);
      } catch (errorResponse: unknown) {
        setSummary(null);
        setTimeline([]);
        const axiosError = errorResponse as AxiosError<ApiErrorResponse>;
        const status = axiosError.response?.status;
        const message = axiosError.response?.data?.message ?? "Failed to load tax summary";
        if (status === 404 && message.toLowerCase().includes("no active tax rules")) {
          setWarning(message);
        } else {
          setError(message);
        }
      } finally {
        setLoading(false);
      }
    };

    void loadSummary();
  }, [navigate, year]);

  const handleSectionClick = async (sectionCode: string) => {
    setSelectedSection(sectionCode);
    setSectionLoading(true);
    setSectionError(null);

    try {
      const response = await getTaxSectionExpenses(year, sectionCode);
      setSectionExpenses(response.expenses);
    } catch (errorResponse: unknown) {
      const axiosError = errorResponse as AxiosError<ApiErrorResponse>;
      setSectionExpenses([]);
      setSectionError(axiosError.response?.data?.message ?? "Failed to load section expenses");
    } finally {
      setSectionLoading(false);
    }
  };

  const handleExportCsv = () => {
    if (!summary) {
      return;
    }

    const rows: string[][] = [
      ["Financial Year", summary.financialYear],
      ["Total Tax Eligible Amount", summary.totalTaxEligibleAmount.toFixed(2)],
      [],
      ["Section", "Title", "Total Spent", "Max Limit", "Remaining Eligible", "Utilization Percent"]
    ];

    summary.sections.forEach((section) => {
      rows.push([
        section.section,
        section.title,
        section.totalSpent.toFixed(2),
        section.maxLimit.toFixed(2),
        section.remainingEligible.toFixed(2),
        section.utilizationPercent.toFixed(2)
      ]);
    });

    downloadCsv(`tax-summary-${summary.financialYear}.csv`, rows);
  };

  const handleExportPdf = () => {
    window.print();
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate("/dashboard");
  };

  return (
    <div className="app-page-bg">
      <div className="app-page-shell space-y-6">
        <section className="app-page-panel sm:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#37598d] bg-[#112447] text-slate-200 hover:bg-[#1a335f]"
                aria-label="Go back"
              >
                <span className="text-base">&larr;</span>
              </button>
              <div>
                <p className="app-page-eyebrow">Tax Planner</p>
                <h1 className="app-page-title">Tax Saving Summary</h1>
                <p className="app-page-subtitle">Identify potentially claimable expenses for income tax filing.</p>
              </div>
            </div>
            <div className="w-full md:w-64">
              <label htmlFor="financialYear" className="mb-1 block text-xs uppercase tracking-[0.08em] text-slate-400">
                Financial Year
              </label>
              <select
                id="financialYear"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="w-full rounded-xl border border-[#3b5b90] bg-[#112447] px-3 py-2 text-sm text-slate-100 outline-none focus:border-indigo-400"
              >
                {yearOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportCsv}
                disabled={!summary}
                className="h-10 rounded-xl border border-[#3b5b90] bg-[#112447] px-4 text-sm font-semibold text-slate-100 transition hover:bg-[#1a335f] disabled:opacity-50"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={!summary}
                className="h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 text-sm font-semibold text-white shadow-[0_8px_18px_rgba(99,102,241,0.35)] transition hover:brightness-105 disabled:opacity-50"
              >
                Export PDF
              </button>
            </div>
          </div>
        </section>

        {warning ? (
          <section className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
            <p className="text-sm font-medium">{warning}</p>
          </section>
        ) : null}

        {loading ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonBlock className="h-32" />
            <SkeletonBlock className="h-32" />
            <SkeletonBlock className="h-32" />
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#2f4a78] bg-[#162746] p-5 shadow-[0_10px_24px_rgba(5,10,26,0.35)]">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Total Tax Eligible</p>
              <p className="mt-3 text-2xl font-bold text-white">{formatCurrency(summary?.totalTaxEligibleAmount ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-[#2f4a78] bg-[#162746] p-5 shadow-[0_10px_24px_rgba(5,10,26,0.35)]">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Sections Used</p>
              <p className="mt-3 text-2xl font-bold text-white">{sectionsUsed}</p>
            </div>
            <div className="rounded-2xl border border-teal-800/70 bg-[#162746] p-5 shadow-[0_10px_24px_rgba(5,10,26,0.35)]">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Remaining Possible Savings</p>
              <p className="mt-3 text-2xl font-bold text-teal-300">{formatCurrency(remainingPossibleSavings)}</p>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-[#294673] bg-[#101f3c] p-5">
          {error ? <p className="text-rose-300">{error}</p> : null}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <SkeletonBlock className="h-44" />
              <SkeletonBlock className="h-44" />
            </div>
          ) : null}

          {!loading && !error && !warning && sections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#3b5b90] bg-[#112447] p-8 text-center">
              <p className="text-lg font-medium text-slate-100">No tax-eligible expenses found for {summary?.financialYear ?? year}</p>
            </div>
          ) : null}

          {!loading && !error && sections.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {sections.map((section) => (
                <SectionCard
                  key={section.section}
                  section={section}
                  isActive={selectedSection === section.section}
                  onClick={handleSectionClick}
                />
              ))}
            </div>
          ) : null}
        </section>

        {!loading && !error && !warning && sections.length > 0 ? (
          <section className="grid gap-4 lg:grid-cols-2">
            <SectionPieChart sections={sections} />
            <UtilizationTimelineChart timeline={timeline} />
          </section>
        ) : null}

        {selectedSection ? (
          <section className="rounded-2xl border border-[#294673] bg-[#101f3c] p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Section {selectedSection} Expense Drilldown</h3>
              <span className="text-sm text-slate-400">{sectionExpenses.length} expenses</span>
            </div>

            {sectionLoading ? (
              <div className="space-y-2">
                <SkeletonBlock className="h-12" />
                <SkeletonBlock className="h-12" />
                <SkeletonBlock className="h-12" />
              </div>
            ) : null}

            {sectionError ? <p className="text-sm text-rose-300">{sectionError}</p> : null}

            {!sectionLoading && !sectionError && sectionExpenses.length === 0 ? (
              <p className="text-sm text-slate-400">No expenses found for this section.</p>
            ) : null}

            {!sectionLoading && !sectionError && sectionExpenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#28436f] text-slate-400">
                      <th className="py-2 text-left text-[11px] uppercase tracking-[0.15em]">Date</th>
                      <th className="py-2 text-left text-[11px] uppercase tracking-[0.15em]">Merchant</th>
                      <th className="py-2 text-left text-[11px] uppercase tracking-[0.15em]">Category</th>
                      <th className="py-2 text-left text-[11px] uppercase tracking-[0.15em]">Payment</th>
                      <th className="py-2 text-right text-[11px] uppercase tracking-[0.15em]">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionExpenses.map((expense) => (
                      <tr key={expense.expenseId} className="border-b border-[#213a62] text-slate-200 hover:bg-[#19315a]">
                        <td className="py-2">{formatDateDDMMYYYY(expense.expenseDate)}</td>
                        <td className="py-2">{expense.merchant}</td>
                        <td className="py-2">{expense.categoryName ?? "N/A"}</td>
                        <td className="py-2">{expense.paymentMode}</td>
                        <td className="py-2 text-right">{formatCurrency(expense.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    </div>
  );
};

export default TaxSummaryPage;
