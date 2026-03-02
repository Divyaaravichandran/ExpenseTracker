import { HfInference } from "@huggingface/inference";
import { HttpError } from "../../utils/HttpError";

export interface ParsedBillResult {
  category: string;
  categoryConfidence: string;
  merchant: string;
  date: string | null;
  amount: number | null;
  rawText: string;
}

const BILL_CATEGORIES = [
  "Food",
  "Shopping",
  "Utilities",
  "Travel",
  "Entertainment",
  "Education",
  "Medical",
  "Fuel",
  "Other"
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Fuel: [
    "fuel",
    "petrol",
    "diesel",
    "cng",
    "gasoline",
    "petrol pump",
    "fuel station",
    "indian oil",
    "ioc",
    "hp petrol",
    "hpcl",
    "bharat petroleum",
    "bpcl",
    "hindustan petroleum"
  ],
  Education: [
    "school",
    "school fees",
    "tuition",
    "tuition fees",
    "college",
    "university",
    "admission",
    "semester fee",
    "term fee",
    "exam fee",
    "books",
    "academy",
    "student"
  ],
  Medical: [
    "hospital",
    "clinic",
    "doctor",
    "pharmacy",
    "medicine",
    "medical",
    "diagnostic",
    "pathology",
    "lab test",
    "healthcare",
    "prescription",
    "patient"
  ]
};

const getKeywordCategoryMatch = (rawText: string): { category: string; confidence: string } | null => {
  const normalizedText = rawText.toLowerCase();
  let bestCategory: string | null = null;
  let bestScore = 0;

  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const score = keywords.reduce((accumulator, keyword) => {
      return accumulator + (normalizedText.includes(keyword) ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
    }
  }

  if (!bestCategory || bestScore === 0) {
    return null;
  }

  // Strong deterministic fallback for OCR-heavy bills when keywords are clearly present.
  const confidence = Math.min(0.92, 0.7 + bestScore * 0.08);
  return { category: bestCategory, confidence: confidence.toFixed(2) };
};

const getHfToken = (): string => {
  const token = process.env.HF_TOKEN?.trim();
  if (!token) {
    throw new HttpError(500, "HF_TOKEN is not configured in backend/.env");
  }
  return token;
};

const getHfClient = (): HfInference => {
  return new HfInference(getHfToken());
};

const extractAmount = (rawText: string): number | null => {
  const strongKeywords = [
    "grand total",
    "total amount",
    "amount payable",
    "net amount",
    "invoice total",
    "bill amount",
    "amount due",
    "total"
  ];
  const weakKeywords = ["amount", "amt", "payable", "net", "inr", "rs", "rupees"];
  const negativeKeywords = [
    "gstin",
    "gst no",
    "phone",
    "mobile",
    "tel",
    "invoice no",
    "bill no",
    "hsn",
    "sac",
    "qty",
    "rate",
    "mrp",
    "discount",
    "cgst",
    "sgst",
    "igst",
    "tax",
    "litre",
    "liter",
    "ltr"
  ];

  const amountRegex = /(?:Rs\.?|RS\.?|INR)?\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{1,2})|[0-9]+(?:\.[0-9]{1,2})?)/g;
  const lines = rawText.split("\n").map((line) => line.trim()).filter(Boolean);
  const scoredCandidates: Array<{ value: number; score: number; lineIndex: number }> = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    const lowerLine = line.toLowerCase();
    const regex = new RegExp(amountRegex.source, "g");
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      const token = match[1];
      const value = Number(token.replace(/,/g, ""));
      if (!Number.isFinite(value) || value <= 0.5 || value > 2_000_000) {
        continue;
      }

      if (!token.includes(".") && value >= 1900 && value <= 2100 && /\b(date|dt|time)\b/i.test(lowerLine)) {
        continue;
      }

      let score = 0;
      if (strongKeywords.some((keyword) => lowerLine.includes(keyword))) {
        score += 9;
      } else if (weakKeywords.some((keyword) => lowerLine.includes(keyword))) {
        score += 4;
      }

      if (negativeKeywords.some((keyword) => lowerLine.includes(keyword))) {
        score -= 5;
      }

      if (/(rs\.?|inr)/i.test(match[0])) {
        score += 2;
      }

      if (token.includes(".")) {
        score += 1;
      }

      scoredCandidates.push({ value, score, lineIndex });
    }
  }

  if (scoredCandidates.length) {
    scoredCandidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      if (b.lineIndex !== a.lineIndex) {
        return b.lineIndex - a.lineIndex;
      }
      return b.value - a.value;
    });

    if (scoredCandidates[0].score > 0) {
      return scoredCandidates[0].value;
    }
  }

  const fallbackMatches = [...rawText.matchAll(new RegExp(amountRegex.source, "g"))]
    .map((match) => Number(match[1].replace(/,/g, "")))
    .filter((value) => Number.isFinite(value) && value > 0.5 && value <= 2_000_000);

  if (!fallbackMatches.length) {
    return null;
  }

  return Math.max(...fallbackMatches);
};

interface NEREntity {
  entity_group?: string;
  word: string;
}

const getMerchant = (entities: NEREntity[] | undefined, rawText: string): string => {
  const nerMerchant = entities
    ?.filter((e) => e.entity_group === "ORG")
    .map((e) => e.word.replace(/##/g, ""))
    .join(" ");

  if (nerMerchant && nerMerchant.length > 5) {
    return nerMerchant;
  }

  const lines = rawText.split("\n").filter((l) => l.trim().length > 2);
  return lines[0] ? lines[0].trim() : "Unknown Merchant";
};

const toIsoDate = (year: number, month: number, day: number): string | null => {
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() + 1 !== month || date.getUTCDate() !== day) {
    return null;
  }

  return `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const parseNumericDateToken = (token: string): string | null => {
  const parts = token.split(/[\/.\-\s]/).map((part) => part.trim()).filter(Boolean);
  if (parts.length !== 3) {
    return null;
  }

  if (!parts.every((part) => /^\d+$/.test(part))) {
    return null;
  }

  if (parts[0].length === 4) {
    return toIsoDate(Number(parts[0]), Number(parts[1]), Number(parts[2]));
  }

  let first = Number(parts[0]);
  let second = Number(parts[1]);
  const rawYear = Number(parts[2]);
  const year = parts[2].length === 2 ? 2000 + rawYear : rawYear;

  // Prefer DD/MM/YYYY, but flip when only MM/DD/YYYY can be valid.
  if (first <= 12 && second > 12) {
    [first, second] = [second, first];
  }

  const day = first;
  const month = second;
  return toIsoDate(year, month, day);
};

const parseMonthNameDateToken = (token: string): string | null => {
  const monthMap: Record<string, number> = {
    jan: 1,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 5,
    jun: 6,
    jul: 7,
    aug: 8,
    sep: 9,
    oct: 10,
    nov: 11,
    dec: 12
  };

  const compact = token.replace(/,/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
  const parts = compact.split(" ");
  if (parts.length !== 3) {
    return null;
  }

  if (monthMap[parts[1]]) {
    const day = Number(parts[0]);
    const month = monthMap[parts[1]];
    const rawYear = Number(parts[2]);
    const year = parts[2].length === 2 ? 2000 + rawYear : rawYear;
    return toIsoDate(year, month, day);
  }

  if (monthMap[parts[0]]) {
    const month = monthMap[parts[0]];
    const day = Number(parts[1]);
    const rawYear = Number(parts[2]);
    const year = parts[2].length === 2 ? 2000 + rawYear : rawYear;
    return toIsoDate(year, month, day);
  }

  return null;
};

const extractDate = (rawText: string): string | null => {
  const lines = rawText.split("\n").map((line) => line.trim()).filter(Boolean);
  const strongDateHintRegex = /(bill\s*date|invoice\s*date|transaction\s*date|txn\s*date|date\s*of\s*issue)\b/i;
  const weakDateHintRegex = /\b(date|dt)\b/i;
  const negativeDateHintRegex = /(due\s*date|expiry|exp(?:iry)?|mfg|valid\s*till)\b/i;
  const numericRegex = /\b(\d{1,4}[\/.-]\d{1,2}[\/.-]\d{1,4}|\d{1,2}\s+\d{1,2}\s+\d{2,4})\b/g;
  const monthNameRegex = /\b(\d{1,2}\s+[A-Za-z]{3,9}\s+\d{2,4}|[A-Za-z]{3,9}\s+\d{1,2},?\s+\d{2,4})\b/g;

  const parseFromText = (text: string): string[] => {
    const candidates: string[] = [];
    const numericMatches = [...text.matchAll(numericRegex)];
    for (let index = numericMatches.length - 1; index >= 0; index -= 1) {
      const candidate = parseNumericDateToken(numericMatches[index][1]);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    const monthMatches = [...text.matchAll(monthNameRegex)];
    for (let index = monthMatches.length - 1; index >= 0; index -= 1) {
      const candidate = parseMonthNameDateToken(monthMatches[index][1]);
      if (candidate) {
        candidates.push(candidate);
      }
    }

    return candidates;
  };

  const lineCandidates: Array<{ value: string; score: number; lineIndex: number }> = [];
  lines.forEach((line, lineIndex) => {
    const parsed = parseFromText(line);
    if (!parsed.length) {
      return;
    }

    let score = 0;
    if (strongDateHintRegex.test(line)) {
      score += 8;
    } else if (weakDateHintRegex.test(line)) {
      score += 4;
    }
    if (negativeDateHintRegex.test(line)) {
      score -= 8;
    }

    parsed.forEach((value) => {
      lineCandidates.push({ value, score, lineIndex });
    });
  });

  if (lineCandidates.length) {
    lineCandidates.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return b.lineIndex - a.lineIndex;
    });
    return lineCandidates[0].value;
  }

  const globalCandidates = parseFromText(rawText);
  return globalCandidates.length ? globalCandidates[0] : null;
};

export async function parseBill(rawText: string): Promise<ParsedBillResult> {
  try {
    const hf = getHfClient();
    const [classification, entities] = await Promise.all([
      hf.zeroShotClassification({
        model: "facebook/bart-large-mnli",
        inputs: rawText,
        parameters: { candidate_labels: BILL_CATEGORIES }
      }),
      hf.tokenClassification({
        model: "dslim/bert-base-NER",
        inputs: rawText
      })
    ]);

    let category = "Other";
    let categoryConfidence = "0";

    if (Array.isArray(classification) && classification.length > 0) {
      const first = classification[0] as { label?: string; score?: number };
      category = first.label ?? "Other";
      categoryConfidence = Number(first.score ?? 0).toFixed(2);
    } else {
      const clsObj = classification as { labels?: string[]; scores?: number[] };
      if (Array.isArray(clsObj.labels) && clsObj.labels.length > 0) {
        category = String(clsObj.labels[0]);
        categoryConfidence = Number(clsObj.scores?.[0] ?? 0).toFixed(2);
      }
    }

    const keywordMatch = getKeywordCategoryMatch(rawText);
    const finalCategory = keywordMatch?.category ?? category;
    const finalConfidence = keywordMatch?.confidence ?? categoryConfidence;

    return {
      category: finalCategory,
      categoryConfidence: finalConfidence,
      merchant: getMerchant(entities as NEREntity[], rawText),
      date: extractDate(rawText),
      amount: extractAmount(rawText),
      rawText
    };
  } catch (error) {
    console.error("HuggingFace parseBill failed:", error);
    const keywordMatch = getKeywordCategoryMatch(rawText);
    const fallbackCategory = keywordMatch?.category ?? "Other";
    const fallbackConfidence = keywordMatch?.confidence ?? "0.35";

    return {
      category: fallbackCategory,
      categoryConfidence: fallbackConfidence,
      merchant: getMerchant(undefined, rawText),
      date: extractDate(rawText),
      amount: extractAmount(rawText),
      rawText
    };
  }
}
