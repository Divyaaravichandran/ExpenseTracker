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

const BILL_CATEGORIES = ["Food", "Shopping", "Utilities", "Travel", "Entertainment", "Other", "Fuel"];

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
  const keywords = ["total", "amount", "amt", "payable", "rs", "rate", "net", "inr"];
  const candidates: number[] = [];
  const regex = /(?:Rs\.?|RS\.?|INR)?\s*([0-9][0-9,]*(?:\.[0-9]+)?)/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(rawText)) !== null) {
    const num = parseFloat(match[1].replace(/,/g, ""));
    if (isNaN(num) || num <= 5 || num === 2025 || num === 2026) {
      continue;
    }

    const startIdx = Math.max(0, match.index - 10);
    const context = rawText.substring(startIdx, match.index + match[0].length).toLowerCase();
    if (keywords.some((k) => context.includes(k))) {
      candidates.push(num);
    }
  }

  return candidates.length ? Math.max(...candidates) : null;
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

const extractDate = (rawText: string): string | null => {
  const dateRegex = /(\d{2}[\/.-]\d{2}[\/.-]\d{2,4}|\d{4}[\/.-]\d{2}[\/.-]\d{2})/g;
  const matches = [...rawText.matchAll(dateRegex)];
  if (!matches.length) {
    return null;
  }

  const lastMatch = matches[matches.length - 1][0];
  const parts = lastMatch.split(/[\/.-]/);

  if (parts.length === 3) {
    let [d, m, y] = parts;
    if (y.length === 2) {
      y = `20${y}`;
    }
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return lastMatch;
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

    return {
      category,
      categoryConfidence,
      merchant: getMerchant(entities as NEREntity[], rawText),
      date: extractDate(rawText),
      amount: extractAmount(rawText),
      rawText
    };
  } catch (error) {
    console.error("HuggingFace parseBill failed:", error);
    if (error instanceof HttpError) {
      throw error;
    }
    throw new HttpError(500, `HuggingFace parsing failed: ${(error as Error).message}`);
  }
}
