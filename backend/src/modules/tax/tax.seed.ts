import { DefaultTaxRuleInput } from "./tax.repository";

export const DEFAULT_TAX_RULES: DefaultTaxRuleInput[] = [
  {
    financialYear: "2025-2026",
    section: "80D",
    title: "Medical Insurance and Preventive Health Checkup",
    applicableCategories: ["Medical"],
    maxLimit: 25000,
    limitType: "yearly",
    isActive: true
  },
  {
    financialYear: "2025-2026",
    section: "80C",
    title: "Tuition Fees (Eligible under 80C)",
    applicableCategories: ["Education"],
    maxLimit: 150000,
    limitType: "yearly",
    isActive: true
  },
  {
    financialYear: "2025-2026",
    section: "80G",
    title: "Other Category",
    applicableCategories: ["Other"],
    maxLimit: 10000,
    limitType: "yearly",
    isActive: true
  }
];
