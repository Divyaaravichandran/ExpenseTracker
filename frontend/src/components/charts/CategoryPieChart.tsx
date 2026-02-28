import React from "react";
import { CategoryShare } from "../../utils/analytics";
import { formatCurrencyINR } from "../../utils/currency";

interface CategoryPieChartProps {
  data: CategoryShare[];
}

const palette = ["#2563eb", "#14b8a6", "#f59e0b", "#ec4899", "#8b5cf6", "#06b6d4", "#22c55e"];

const CategoryPieChart: React.FC<CategoryPieChartProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-cyan-100">
        <h3 className="text-lg font-semibold text-slate-900">Category Distribution</h3>
        <p className="mt-4 text-sm text-slate-500">No data available.</p>
      </div>
    );
  }

  let cursor = 0;
  const gradient = data
    .map((item, index) => {
      const start = cursor;
      const end = cursor + item.sharePercent;
      cursor = end;
      return `${palette[index % palette.length]} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-lg shadow-cyan-100">
      <h3 className="text-lg font-semibold text-slate-900">Category Distribution</h3>
      <div className="mt-5 flex flex-col items-center gap-5 lg:flex-row lg:items-start">
        <div className="h-44 w-44 rounded-full border border-slate-200" style={{ background: `conic-gradient(${gradient})` }} />
        <div className="w-full space-y-2">
          {data.map((item, index) => (
            <div key={item.category} className="flex items-center justify-between text-sm">
              <span className="inline-flex items-center gap-2 text-slate-700">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: palette[index % palette.length] }} />
                {item.category}
              </span>
              <span className="font-medium text-slate-900">
                {item.sharePercent.toFixed(1)}% ({formatCurrencyINR(item.total)})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPieChart;
