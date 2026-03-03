import React from "react";
import { motion } from "framer-motion";

type KpiIconType = "wallet" | "calendar" | "receipt" | "spark";

export interface KpiCardItem {
  title: string;
  value: string;
  icon: KpiIconType;
  trendValue: string;
  trendDirection: "up" | "down";
}

interface KpiCardProps {
  item: KpiCardItem;
  darkMode: boolean;
}

const Icon = ({ icon }: { icon: KpiIconType }) => {
  if (icon === "wallet") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <rect x="3.5" y="6" width="17" height="12" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M16 10.2H20.5V13.8H16C15.2 13.8 14.5 13.1 14.5 12C14.5 10.9 15.2 10.2 16 10.2Z" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (icon === "calendar") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <rect x="4" y="5.5" width="16" height="14.5" rx="2.2" stroke="currentColor" strokeWidth="1.8" />
        <path d="M8 3.7V7M16 3.7V7M4 9.2H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  if (icon === "receipt") {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M7 4.5H17V19.5L15 18L13 19.5L11 18L9 19.5L7 18V4.5Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9.5 9H14.5M9.5 12.5H14.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
      <path d="M12 3.5L13.8 9.2L19.5 11L13.8 12.8L12 18.5L10.2 12.8L4.5 11L10.2 9.2L12 3.5Z" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
};

const KpiCard = ({ item, darkMode }: KpiCardProps) => (
  <motion.article
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2 }}
    className={`rounded-2xl border p-4 ${
      darkMode
        ? "border-[#8ab4ff22] bg-[linear-gradient(145deg,rgba(15,30,64,0.62),rgba(8,18,42,0.64))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
        : "border-white/80 bg-[linear-gradient(145deg,rgba(255,255,255,0.95),rgba(245,248,255,0.9))]"
    }`}
  >
    <div className="flex items-center justify-between">
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          darkMode ? "bg-cyan-400/10 text-cyan-200 shadow-[0_0_18px_rgba(34,211,238,0.2)]" : "bg-indigo-100 text-indigo-600"
        }`}
      >
        <Icon icon={item.icon} />
      </span>
      <span className={`text-xs font-medium ${darkMode ? "text-slate-300" : "text-slate-500"}`}>{item.title}</span>
    </div>
    <p className={`mt-4 text-2xl font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>{item.value}</p>
    <div className="mt-2 flex items-center gap-1 text-xs">
      <span className={item.trendDirection === "up" ? "text-emerald-500" : "text-rose-500"}>
        {item.trendDirection === "up" ? "▲" : "▼"}
      </span>
      <span className={item.trendDirection === "up" ? "text-emerald-500" : "text-rose-500"}>{item.trendValue}</span>
    </div>
  </motion.article>
);

export default KpiCard;
