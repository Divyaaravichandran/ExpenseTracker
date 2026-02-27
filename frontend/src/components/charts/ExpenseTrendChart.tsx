import React from "react";
import { MonthlyPoint } from "../../utils/analytics";
import { formatCurrencyINR } from "../../utils/currency";

interface ExpenseTrendChartProps {
  data: MonthlyPoint[];
}

const ExpenseTrendChart: React.FC<ExpenseTrendChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">Monthly Spending Trend</h3>
        <p className="mt-4 text-sm text-slate-500">No data available.</p>
      </div>
    );
  }

  const maxValue = Math.max(...data.map((point) => point.total), 1);
  const chartHeight = 180;
  const chartWidth = 520;
  const stepX = data.length > 1 ? chartWidth / (data.length - 1) : chartWidth;

  const points = data
    .map((point, index) => {
      const x = index * stepX;
      const y = chartHeight - (point.total / maxValue) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-900">Monthly Spending Trend</h3>
      <div className="mt-4 overflow-x-auto">
        <svg width={chartWidth} height={chartHeight + 24} className="min-w-full">
          <polyline fill="none" stroke="#111827" strokeWidth="3" points={points} />
          {data.map((point, index) => {
            const x = index * stepX;
            const y = chartHeight - (point.total / maxValue) * chartHeight;
            return <circle key={`${point.month}-dot`} cx={x} cy={y} r="4" fill="#111827" />;
          })}
        </svg>
      </div>
      <div className="mt-2 grid gap-1 text-xs text-slate-600 sm:grid-cols-2">
        {data.map((point) => (
          <div key={point.month} className="flex items-center justify-between rounded border border-slate-100 px-2 py-1">
            <span>{point.month}</span>
            <span className="font-medium text-slate-900">{formatCurrencyINR(point.total)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExpenseTrendChart;
