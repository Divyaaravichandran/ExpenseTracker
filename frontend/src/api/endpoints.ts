export const ENDPOINTS = {
  bills: {
    upload: "/api/v1/bills/upload",
    confirm: "/api/v1/bills/confirm",
    list: "/api/v1/bills",
    manual: "/api/v1/bills/manual",
    expenses: "/api/v1/bills/expenses",
    categories: "/api/v1/bills/categories"
  },
  expenses: {
    base: "/api/v1/expenses"
  },
  jobs: {
    base: "/api/v1/jobs"
  },
  reports: {
    taxSummary: "/api/v1/reports/tax-summary",
    taxSectionExpenses: "/api/v1/reports/tax-summary/section-expenses",
    taxTimeline: "/api/v1/reports/tax-summary/timeline"
  },
  taxRules: {
    base: "/api/v1/tax-rules",
    overrideExpense: "/api/v1/tax-rules/expenses"
  }
} as const;
