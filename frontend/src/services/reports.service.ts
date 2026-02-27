import api from "../api/axios";
import { ENDPOINTS } from "../api/endpoints";

export interface TaxSectionSummary {
  section: string;
  title: string;
  totalSpent: number;
  maxLimit: number;
  remainingEligible: number;
  utilizationPercent: number;
}

export interface TaxSummaryResponse {
  financialYear: string;
  sections: TaxSectionSummary[];
  totalTaxEligibleAmount: number;
}

export interface TaxSectionExpenseItem {
  expenseId: string;
  merchant: string;
  amount: number;
  expenseDate: string;
  paymentMode: string;
  description: string;
  categoryName: string | null;
}

export interface TaxSectionExpensesResponse {
  financialYear: string;
  section: string;
  totalSpent: number;
  expenses: TaxSectionExpenseItem[];
}

export interface TaxTimelinePoint {
  month: string;
  totalSpent: number;
}

export interface TaxTimelineResponse {
  financialYear: string;
  timeline: TaxTimelinePoint[];
}

export const getTaxSummary = async (year: string): Promise<TaxSummaryResponse> => {
  const response = await api.get(ENDPOINTS.reports.taxSummary, {
    params: { financialYear: year }
  });

  return response.data as TaxSummaryResponse;
};

export const getTaxSectionExpenses = async (
  financialYear: string,
  section: string
): Promise<TaxSectionExpensesResponse> => {
  const response = await api.get(ENDPOINTS.reports.taxSectionExpenses, {
    params: { financialYear, section }
  });

  return response.data as TaxSectionExpensesResponse;
};

export const getTaxTimeline = async (financialYear: string): Promise<TaxTimelineResponse> => {
  const response = await api.get(ENDPOINTS.reports.taxTimeline, {
    params: { financialYear }
  });

  return response.data as TaxTimelineResponse;
};
