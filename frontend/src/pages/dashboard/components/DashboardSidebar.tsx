import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

interface DashboardSidebarProps {
  onLogout: () => void;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <rect x="4" y="4" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="4" width="7" height="4" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="10" width="7" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="13" width="7" height="7" rx="2" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    )
  },
  {
    label: "Transactions",
    path: "/transactions",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M6 7H18M6 12H15M6 17H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    label: "Expense Hub",
    path: "/expenses",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <rect x="6" y="3.5" width="12" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 8.5H15M9 12H15M9 15.5H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    label: "Reports",
    path: "/reports",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M5 19.5H19M8 17V10M12 17V6.5M16 17V12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    label: "Tax Summary",
    path: "/tax-summary",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <path d="M7 4.5H17V19.5H7V4.5Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9.5 9H14.5M9.5 12.5H14.5M9.5 16H12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
];

const expenseHubPaths = ["/upload", "/expenses"];

const DashboardSidebar = ({ onLogout }: DashboardSidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <>
      <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-2 lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const isActive = item.label === "Expense Hub" ? expenseHubPaths.includes(currentPath) : currentPath === item.path;
            return (
              <button
                key={`mobile-${item.label}`}
                type="button"
                onClick={() => navigate(item.path)}
                className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs transition ${
                  isActive
                    ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-200"
                    : "border-white/10 bg-white/5 text-slate-200"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <aside
        className="sticky top-4 hidden h-[calc(100vh-2rem)] w-28 flex-col justify-between rounded-[20px] border border-[#8ab4ff24] bg-[linear-gradient(180deg,rgba(106,141,214,0.16),rgba(26,42,78,0.2))] p-3 backdrop-blur-xl shadow-2xl shadow-black/25 lg:flex"
      >
        <div>
          <div className="mb-4 flex h-12 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-cyan-300">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M5 4L14 2L19 5L10 10L5 4Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M10 10V21L14 18V13L19 10V5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const isActive = item.label === "Expense Hub" ? expenseHubPaths.includes(currentPath) : currentPath === item.path;
              return (
                <div key={item.label}>
                  <button
                    type="button"
                    onClick={() => navigate(item.path)}
                    className={`group w-full rounded-xl border p-2 transition-all hover:-translate-y-0.5 ${
                      isActive
                        ? "border-cyan-400/45 bg-cyan-400/15 text-cyan-200"
                        : "border-transparent text-slate-300 hover:border-white/10 hover:bg-white/5"
                    }`}
                  >
                    <div className="mx-auto flex w-fit flex-col items-center gap-1.5">
                      {item.icon}
                      <span className="text-[10px] leading-none">{item.label}</span>
                    </div>
                  </button>
                </div>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="rounded-xl border border-white/15 bg-white/5 px-2 py-2 text-xs text-slate-200 transition hover:-translate-y-0.5 hover:bg-white/10"
        >
          Logout
        </button>
      </aside>
    </>
  );
};

export default DashboardSidebar;
