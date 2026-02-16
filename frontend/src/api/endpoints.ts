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
  }
} as const;
