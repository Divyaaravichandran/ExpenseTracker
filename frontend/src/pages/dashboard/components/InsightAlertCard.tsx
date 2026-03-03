import React from "react";
import { motion } from "framer-motion";

export interface InsightAlertItem {
  type: "warning" | "info" | "success";
  title: string;
  description: React.ReactNode;
}

interface InsightAlertCardProps {
  item: InsightAlertItem;
  darkMode: boolean;
}

const toneStyles: Record<InsightAlertItem["type"], { dot: string; borderDark: string; borderLight: string; bgDark: string; bgLight: string }> = {
  warning: {
    dot: "bg-amber-400",
    borderDark: "border-amber-300/30",
    borderLight: "border-rose-200",
    bgDark: "bg-amber-500/10",
    bgLight: "bg-rose-50"
  },
  info: {
    dot: "bg-blue-400",
    borderDark: "border-blue-300/30",
    borderLight: "border-sky-200",
    bgDark: "bg-blue-500/10",
    bgLight: "bg-sky-50"
  },
  success: {
    dot: "bg-emerald-400",
    borderDark: "border-emerald-300/30",
    borderLight: "border-emerald-200",
    bgDark: "bg-emerald-500/9",
    bgLight: "bg-emerald-50"
  }
};

const InsightAlertCard = ({ item, darkMode }: InsightAlertCardProps) => (
  <motion.article
    whileHover={{ y: -3 }}
    transition={{ duration: 0.2 }}
    className={`rounded-2xl border p-4 ${
      darkMode
        ? `${toneStyles[item.type].borderDark} ${toneStyles[item.type].bgDark}`
        : `${toneStyles[item.type].borderLight} ${toneStyles[item.type].bgLight}`
    }`}
  >
    <div className="flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${toneStyles[item.type].dot}`} />
      <h3 className={`text-sm font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>{item.title}</h3>
    </div>
    <p className={`mt-2 text-sm leading-relaxed ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{item.description}</p>
  </motion.article>
);

export default InsightAlertCard;
