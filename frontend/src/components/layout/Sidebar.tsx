import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
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
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
        <path d="M6 7H18M6 12H15M6 17H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    label: "Expense Hub",
    path: "/expenses",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
        <rect x="6" y="3.5" width="12" height="17" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 8.5H15M9 12H15M9 15.5H13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    label: "Reports",
    path: "/reports",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
        <path d="M5 19.5H19M8 17V10M12 17V6.5M16 17V12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  },
  {
    label: "Tax Summary",
    path: "/tax-summary",
    icon: (
      <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none">
        <path d="M7 4.5H17V19.5H7V4.5Z" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9.5 9H14.5M9.5 12.5H14.5M9.5 16H12.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }
];

const expenseHubPaths = ["/upload", "/expenses"];

const isActiveItem = (path: string, currentPath: string): boolean => {
  if (path === "/expenses") {
    return expenseHubPaths.includes(currentPath);
  }
  return currentPath === path;
};

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const handleLogout = () => {
    localStorage.removeItem("token");
    sessionStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <>
      <div className="sticky top-0 z-30 w-full border-b border-[#2f4e83] bg-[linear-gradient(180deg,#0a1633,#08142d)] px-3 py-2 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto">
          {navItems.map((item) => {
            const active = isActiveItem(item.path, currentPath);
            return (
              <button
                key={`mobile-${item.label}`}
                type="button"
                onClick={() => navigate(item.path)}
                className={`whitespace-nowrap rounded-xl border px-3 py-2 text-xs transition ${
                  active
                    ? "border-cyan-400/40 bg-cyan-400/15 text-cyan-200"
                    : "border-[#355a94] bg-[#102449] text-slate-200"
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="whitespace-nowrap rounded-xl border border-[#355a94] bg-[#102449] px-3 py-2 text-xs text-slate-200 transition hover:bg-[#15305f]"
          >
            Logout
          </button>
        </div>
      </div>

      <aside className="fixed left-4 top-4 z-30 hidden h-[calc(100vh-2rem)] w-32 flex-col justify-between rounded-[20px] border border-[#2f4e83] bg-[linear-gradient(180deg,rgba(8,22,52,0.96),rgba(5,17,40,0.92))] p-3 shadow-2xl shadow-black/35 backdrop-blur-xl lg:flex">
        <div>
          <div className="mb-4 flex h-14 items-center justify-center rounded-2xl border border-[#2f4e83] bg-[#102449] text-cyan-300">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path d="M5 4L14 2L19 5L10 10L5 4Z" stroke="currentColor" strokeWidth="1.6" />
              <path d="M10 10V21L14 18V13L19 10V5" stroke="currentColor" strokeWidth="1.6" />
            </svg>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const active = isActiveItem(item.path, currentPath);
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`group w-full rounded-xl border p-2.5 transition-all hover:-translate-y-0.5 ${
                    active
                      ? "border-cyan-400/45 bg-cyan-400/15 text-cyan-200"
                      : "border-transparent text-slate-300 hover:border-[#355a94] hover:bg-[#102449]"
                  }`}
                >
                    <div className="mx-auto flex w-fit flex-col items-center gap-2">
                      {item.icon}
                      <span className="text-xs leading-none">{item.label}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="rounded-xl border border-[#355a94] bg-[#102449] px-2 py-2.5 text-sm text-slate-200 transition hover:-translate-y-0.5 hover:bg-[#15305f]"
        >
          Logout
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
