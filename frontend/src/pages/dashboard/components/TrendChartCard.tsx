import React, { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { formatCurrencyINR } from "../../../utils/currency";

interface TrendDataPoint {
  month: string;
  total: number;
}

interface TrendChartCardProps {
  data: TrendDataPoint[];
  loading: boolean;
  darkMode: boolean;
}

const TrendChartCard = ({ data, loading, darkMode }: TrendChartCardProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const width = 1000;
  const height = 280;

  const { points, yTicks } = useMemo(() => {
    const max = Math.max(...data.map((point) => point.total), 1);
    const min = Math.min(...data.map((point) => point.total), 0);
    const chartHeight = height - 24;
    const step = data.length > 1 ? width / (data.length - 1) : width;
    const mapped = data.map((point, idx) => {
      const x = idx * step;
      const ratio = max === min ? 0.2 : (point.total - min) / (max - min);
      const y = chartHeight - ratio * (chartHeight - 30);
      return { x, y, month: point.month, total: point.total };
    });
    const ticks = Array.from({ length: 5 }).map((_, i) => Math.round((max / 4) * (4 - i)));
    return { points: mapped, yTicks: ticks };
  }, [data]);

  const linePoints = points.map((point) => `${point.x},${point.y}`).join(" ");
  const areaPath = points.length ? `M0,${height} L${linePoints} L${width},${height} Z` : "";

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
      <h3 className={`text-base font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>Monthly Spending Trend</h3>

      {loading ? (
        <div className={`mt-4 h-[300px] animate-pulse rounded-xl ${darkMode ? "bg-white/5" : "bg-slate-100"}`} />
      ) : (
        <div className="relative mt-4">
          <div className="flex gap-3">
            <div className={`flex h-[280px] flex-col justify-between text-[11px] ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
              {yTicks.map((tick) => (
                <span key={`tick-${tick}`}>{formatCurrencyINR(tick).replace(".00", "")}</span>
              ))}
            </div>

            <div className="relative min-w-0 flex-1 overflow-x-auto">
              <svg viewBox={`0 0 ${width} ${height}`} className="h-[280px] min-w-[720px] w-full">
                <defs>
                  <linearGradient id="trend-line-gradient" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#24c4ff" />
                    <stop offset="100%" stopColor="#49e5ff" />
                  </linearGradient>
                  <linearGradient id="trend-area-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#35d5ff" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#35d5ff" stopOpacity="0.02" />
                  </linearGradient>
                </defs>

                {Array.from({ length: 5 }).map((_, idx) => {
                  const y = (height / 4) * idx;
                  return (
                    <line
                      key={`grid-${idx + 1}`}
                      x1="0"
                      y1={y}
                      x2={width}
                      y2={y}
                      stroke={darkMode ? "rgba(148,163,184,0.22)" : "rgba(148,163,184,0.28)"}
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {areaPath ? <path d={areaPath} fill="url(#trend-area-gradient)" /> : null}
                <polyline points={linePoints} fill="none" stroke="url(#trend-line-gradient)" strokeWidth="3" strokeLinejoin="round" />

                {points.map((point, idx) => (
                  <g key={`${point.month}-${idx}`}>
                    <circle
                      cx={point.x}
                      cy={point.y}
                      r={hoveredIndex === idx ? 6 : 4}
                      fill="#22d3ee"
                      className="cursor-pointer transition-all"
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  </g>
                ))}
              </svg>

              {hoveredIndex !== null ? (
                <div
                  className={`pointer-events-none absolute z-10 rounded-lg border px-3 py-2 text-xs shadow-lg ${
                    darkMode ? "border-white/15 bg-slate-900/90 text-slate-100" : "border-slate-200 bg-white text-slate-700"
                  }`}
                  style={{
                    left: `calc(${(points[hoveredIndex].x / width) * 100}% - 24px)`,
                    top: `${Math.max(points[hoveredIndex].y - 34, 8)}px`
                  }}
                >
                  <p className="font-medium">{points[hoveredIndex].month}</p>
                  <p>{formatCurrencyINR(points[hoveredIndex].total)}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className={`ml-8 mt-3 grid min-w-[720px] grid-cols-12 text-center text-xs ${darkMode ? "text-slate-400" : "text-slate-500"}`}>
            {data.map((item) => (
              <span key={`label-${item.month}`}>{item.month}</span>
            ))}
          </div>
        </div>
      )}
    </motion.section>
  );
};

export default TrendChartCard;
