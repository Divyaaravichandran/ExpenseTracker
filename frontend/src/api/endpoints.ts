export const ENDPOINTS = {
  bills: {
    upload: "/api/v1/bills/upload",
    list: "/api/v1/bills",
    manual: "/api/v1/bills/manual",
    expenses: "/api/v1/bills/expenses",
    categories: "/api/v1/bills/categories"
  }
} as const;