/**
 * Returns the Indian financial year (April 1 to March 31) for a given date.
 * Example: July 10, 2025 -> "2025-2026", February 15, 2026 -> "2025-2026".
 */
export const getFinancialYear = (date: Date): string => {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth();
  const startYear = month >= 3 ? year : year - 1;
  return `${startYear}-${startYear + 1}`;
};

/**
 * Validates financial year string format and consecutive year sequence.
 */
export const isValidFinancialYear = (financialYear: string): boolean => {
  const match = /^(\d{4})-(\d{4})$/.exec(financialYear);
  if (!match) {
    return false;
  }

  const startYear = Number(match[1]);
  const endYear = Number(match[2]);
  return endYear === startYear + 1;
};
