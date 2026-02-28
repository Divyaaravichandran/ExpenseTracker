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
      className={`rounded-xl border bg-neutral-50 p-5 text-left transition ${
        isActive ? "border-neutral-900 ring-1 ring-neutral-900" : "border-neutral-200 hover:border-neutral-400"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Section {section.section}</h2>
          <p className="text-sm text-neutral-600">{section.title}</p>
        </div>
        <span className="rounded-full border border-neutral-300 px-2 py-0.5 text-xs text-neutral-700">
          {section.utilizationPercent.toFixed(0)}% utilized
        </span>
      </div>

      <div className="mt-4 space-y-2 text-sm text-neutral-700">
        <p>
          Total Spent: <span className="font-medium text-neutral-900">{formatCurrency(section.totalSpent)}</span>
        </p>
        <p>
          Max Limit: <span className="font-medium text-neutral-900">{formatCurrency(section.maxLimit)}</span>
        </p>
        <p>
          Remaining Amount: <span className="font-medium text-neutral-900">{formatCurrency(section.remainingEligible)}</span>
        </p>
      </div>

      <div className="mt-4 h-2 w-full rounded-full bg-neutral-200">
        <div
          className="h-full rounded-full bg-neutral-900 transition-all duration-300"
          style={{ width: `${Math.min(section.utilizationPercent, 100)}%` }}
        />
      </div>
    </button>
  );
};

const SkeletonBlock: React.FC<{ className?: string }> = ({ className = "" }) => (
  <div className={`animate-pulse rounded-xl bg-neutral-200 ${className}`} />
);

const SectionPieChart: React.FC<{ sections: TaxSectionSummary[] }> = ({ sections }) => {
  const total = sections.reduce((sum, section) => sum + section.totalSpent, 0);
  const palette = ["#171717", "#404040", "#737373", "#a3a3a3", "#d4d4d4", "#525252", "#262626"];
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
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-neutral-900">Spend by Section</h3>
      <div className="mt-4 flex flex-col items-center gap-4 md:flex-row md:items-start">
        <div
          className="h-44 w-44 rounded-full border border-neutral-200"
          style={{
            background: gradientParts.length > 0 ? `conic-gradient(${gradientParts.join(", ")})` : "#f5f5f5"
          }}
        />
        <div className="w-full space-y-2">
          {slices.map((slice) => (
            <div key={slice.section} className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 text-neutral-700">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
                {slice.section}
              </span>
              <span className="font-medium text-neutral-900">{slice.value.toFixed(1)}%</span>
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
    <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-neutral-900">Utilization Over Time</h3>
      <div className="mt-4 space-y-3">
        {timeline.length === 0 ? <p className="text-sm text-neutral-500">No timeline data yet.</p> : null}
        {timeline.map((item) => {
          const width = maxSpent > 0 ? (item.totalSpent / maxSpent) * 100 : 0;
          return (
            <div key={item.month} className="grid grid-cols-[80px_1fr_120px] items-center gap-3 text-sm">
              <span className="text-neutral-600">{item.month}</span>
              <div className="h-2 rounded-full bg-neutral-200">
                <div className="h-full rounded-full bg-neutral-900" style={{ width: `${Math.max(width, 2)}%` }} />
              </div>
              <span className="text-right font-medium text-neutral-900">{formatCurrency(item.totalSpent)}</span>
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-cyan-50 text-neutral-900">
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-cyan-100 backdrop-blur">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={handleBack}
                className="mt-1 inline-flex h-9 w-9 items-center justify-center rounded-full border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
                aria-label="Go back"
              >
                <span className="text-base">&larr;</span>
              </button>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Tax Planner</p>
                <h1 className="text-3xl font-bold tracking-tight">Tax Saving Summary</h1>
                <p className="mt-2 text-sm text-neutral-600">Identify potentially claimable expenses for income tax filing.</p>
              </div>
            </div>
            <div className="w-full md:w-64">
              <label htmlFor="financialYear" className="mb-1 block text-sm font-medium text-neutral-700">
                Financial Year
              </label>
              <select
                id="financialYear"
                value={year}
                onChange={(event) => setYear(event.target.value)}
                className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-neutral-900 focus:outline-none"
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
                className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-800 hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleExportPdf}
                disabled={!summary}
                className="rounded-lg border border-neutral-900 bg-neutral-900 px-3 py-2 text-xs font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                Export PDF
              </button>
            </div>
          </div>
        </section>

        {warning ? (
          <section className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
            <p className="text-sm font-medium">{warning}</p>
          </section>
        ) : null}

        {loading ? (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <SkeletonBlock className="h-28" />
            <SkeletonBlock className="h-28" />
            <SkeletonBlock className="h-28" />
          </section>
        ) : (
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Total Tax Eligible</p>
              <p className="mt-3 text-2xl font-semibold">{formatCurrency(summary?.totalTaxEligibleAmount ?? 0)}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Sections Used</p>
              <p className="mt-3 text-2xl font-semibold">{sectionsUsed}</p>
            </div>
            <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Remaining Possible Savings</p>
              <p className="mt-3 text-2xl font-semibold">{formatCurrency(remainingPossibleSavings)}</p>
            </div>
          </section>
        )}

        <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
          {error ? <p className="text-red-600">{error}</p> : null}

          {loading ? (
            <div className="grid gap-4 md:grid-cols-2">
              <SkeletonBlock className="h-56" />
              <SkeletonBlock className="h-56" />
            </div>
          ) : null}

          {!loading && !error && !warning && sections.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
              <p className="text-lg font-medium text-neutral-900">No tax-eligible expenses found for {summary?.financialYear ?? year}</p>
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
          <section className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Section {selectedSection} Expense Drilldown</h3>
              <span className="text-sm text-neutral-600">{sectionExpenses.length} expenses</span>
            </div>

            {sectionLoading ? (
              <div className="space-y-2">
                <SkeletonBlock className="h-12" />
                <SkeletonBlock className="h-12" />
                <SkeletonBlock className="h-12" />
              </div>
            ) : null}

            {sectionError ? <p className="text-sm text-red-600">{sectionError}</p> : null}

            {!sectionLoading && !sectionError && sectionExpenses.length === 0 ? (
              <p className="text-sm text-neutral-600">No expenses found for this section.</p>
            ) : null}

            {!sectionLoading && !sectionError && sectionExpenses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 text-neutral-500">
                      <th className="py-2 text-left">Date</th>
                      <th className="py-2 text-left">Merchant</th>
                      <th className="py-2 text-left">Category</th>
                      <th className="py-2 text-left">Payment</th>
                      <th className="py-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sectionExpenses.map((expense) => (
                      <tr key={expense.expenseId} className="border-b border-neutral-100 text-neutral-800">
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
