import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatCurrencyINR } from "../../../utils/currency";

interface CategoryDatum {
  category: string;
  total: number;
  sharePercent: number;
}

interface DonutChartCardProps {
  data: CategoryDatum[];
  loading: boolean;
  darkMode: boolean;
}

const palette = ["#3c82ff", "#8b5cf6", "#22d3ee", "#94a3b8", "#0ea5e9", "#64748b"];

const DonutChartCard = ({ data, loading, darkMode }: DonutChartCardProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const total = data.reduce((sum, item) => sum + item.total, 0);

  const segments = useMemo(() => {
    let acc = 0;
    return data.map((item) => {
      const ratio = item.sharePercent / 100;
      const size = ratio * circumference;
      const segment = {
        ...item,
        size,
        offset: -acc,
        ratio
      };
      acc += size;
      return segment;
    });
  }, [data, circumference]);

  return (
    <motion.section
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className={`rounded-[20px] border p-5 ${
        darkMode
          ? "border-[#8ab4ff1f] bg-[linear-gradient(145deg,rgba(12,27,58,0.62),rgba(7,18,40,0.7))]"
          : "border-slate-200 bg-white/75"
      }`}
    >
      <h3 className={`text-base font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>Category Distribution</h3>

      {loading ? (
        <div className={`mt-4 h-[300px] animate-pulse rounded-xl ${darkMode ? "bg-white/5" : "bg-slate-100"}`} />
      ) : data.length === 0 ? (
        <div className={`mt-4 rounded-xl border p-6 text-sm ${darkMode ? "border-white/10 text-slate-300" : "border-slate-200 text-slate-600"}`}>
          No category distribution available for this month.
        </div>
      ) : (
        <div className="mt-4 flex flex-col items-center gap-5">
          <div className="relative">
            <svg width="210" height="210" viewBox="0 0 210 210">
              <circle cx="105" cy="105" r={radius} stroke={darkMode ? "rgba(148,163,184,0.22)" : "rgba(148,163,184,0.25)"} strokeWidth="20" fill="none" />
              <g transform="rotate(-90 105 105)">
                {segments.map((segment, idx) => (
                  <circle
                    key={`${segment.category}-${idx}`}
                    cx="105"
                    cy="105"
                    r={radius}
                    fill="none"
                    stroke={palette[idx % palette.length]}
                    strokeWidth={hoveredIndex === idx ? "24" : "20"}
                    strokeDasharray={`${segment.size} ${circumference - segment.size}`}
                    strokeDashoffset={segment.offset}
                    strokeLinecap="round"
                    className="cursor-pointer transition-all"
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  />
                ))}
              </g>
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-500"}`}>Total</span>
              <span className={`text-lg font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>{formatCurrencyINR(total)}</span>
            </div>
          </div>

          <div className="w-full space-y-2">
            {segments.map((segment, idx) => (
              <div
                key={`legend-${segment.category}-${idx}`}
                className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${
                  darkMode ? "border-white/10 bg-white/5 text-slate-200" : "border-slate-200 bg-white text-slate-700"
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: palette[idx % palette.length] }} />
                  {segment.category}
                </span>
                <span className="font-medium">{segment.sharePercent.toFixed(1)}%</span>
              </div>
            ))}
          </div>

          {hoveredIndex !== null ? (
            <div
              className={`w-full rounded-lg border px-3 py-2 text-xs ${
                darkMode ? "border-white/10 bg-slate-900/60 text-slate-100" : "border-slate-200 bg-white text-slate-700"
              }`}
            >
              <p className="font-medium">{segments[hoveredIndex].category}</p>
              <p>{formatCurrencyINR(segments[hoveredIndex].total)}</p>
            </div>
          ) : null}
        </div>
      )}
    </motion.section>
  );
};

export default DonutChartCard;
