import React from "react";
import { motion } from "framer-motion";

type Tone = "success" | "warning" | "danger" | "info";
type Icon = "target" | "alert" | "leaf";

export interface DecisionSupportItem {
  icon: Icon;
  title: string;
  value: string;
  subtext: string;
  progress: number;
  tone: Tone;
}

interface DecisionSupportCardProps {
  item: DecisionSupportItem;
  darkMode: boolean;
}

const toneClass: Record<Tone, { bar: string; text: string; chipDark: string; chipLight: string }> = {
  success: {
    bar: "from-emerald-500 to-teal-400",
    text: "text-emerald-500",
    chipDark: "bg-emerald-500/15 text-emerald-300",
    chipLight: "bg-emerald-100 text-emerald-700"
  },
  warning: {
    bar: "from-amber-500 to-orange-400",
    text: "text-amber-500",
    chipDark: "bg-amber-500/15 text-amber-300",
    chipLight: "bg-amber-100 text-amber-700"
  },
  danger: {
    bar: "from-rose-500 to-red-500",
    text: "text-rose-500",
    chipDark: "bg-rose-500/15 text-rose-300",
    chipLight: "bg-rose-100 text-rose-700"
  },
  info: {
    bar: "from-sky-500 to-cyan-400",
    text: "text-sky-500",
    chipDark: "bg-sky-500/15 text-sky-300",
    chipLight: "bg-sky-100 text-sky-700"
  }
};

const IconView = ({ icon }: { icon: Icon }) => {
  if (icon === "target") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <circle cx="12" cy="12" r="7.5" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    );
  }
  if (icon === "alert") {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
        <path d="M12 4.5L20 19.5H4L12 4.5Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M12 9V13M12 16H12.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none">
      <path d="M7 13C7 9.5 9.5 7 13 7C16.5 7 19 9.5 19 13C19 16.5 16.5 19 13 19H10C8 19 6.5 17.5 6.5 15.5C6.5 14.2 7 13.3 7.8 12.6" stroke="currentColor" strokeWidth="1.8" />
      <path d="M10 12.5L12 14.5L16 10.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
};

const DecisionSupportCard = ({ item, darkMode }: DecisionSupportCardProps) => {
  const width = `${Math.min(Math.max(item.progress, 0), 100)}%`;

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className={`rounded-2xl border p-4 ${
        darkMode
          ? "border-[#8ab4ff1f] bg-[linear-gradient(145deg,rgba(12,27,58,0.62),rgba(7,18,40,0.7))]"
          : "border-slate-200 bg-white/90"
      }`}
    >
      <div className="flex items-center justify-between">
        <p className={`text-sm font-medium ${darkMode ? "text-slate-200" : "text-slate-700"}`}>{item.title}</p>
        <span
          className={`inline-flex h-7 items-center gap-1 rounded-full px-2 text-xs ${darkMode ? toneClass[item.tone].chipDark : toneClass[item.tone].chipLight}`}
        >
          <IconView icon={item.icon} />
          Risk
        </span>
      </div>
      <p className={`mt-3 text-xl font-semibold ${darkMode ? "text-white" : "text-slate-900"}`}>{item.value}</p>
      <p className={`mt-1 text-xs ${darkMode ? "text-slate-300" : "text-slate-500"}`}>{item.subtext}</p>
      <div className={`mt-4 h-2.5 overflow-hidden rounded-full ${darkMode ? "bg-white/10" : "bg-slate-100"}`}>
        <div className={`h-full bg-gradient-to-r ${toneClass[item.tone].bar}`} style={{ width }} />
      </div>
      <p className={`mt-2 text-xs font-medium ${toneClass[item.tone].text}`}>{item.progress.toFixed(0)}%</p>
    </motion.article>
  );
};

export default DecisionSupportCard;
