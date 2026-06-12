import type { NgCategory, NgIngredientRecord, NgMatch } from "./types";

const CATEGORY_LABELS: Record<NgCategory, string> = {
  pork: "豚由来",
  alcohol: "アルコール",
  gelatin: "動物性ゼラチン",
  other: "その他",
};

export function normalizeText(text: string): string {
  return text.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
}

export function findNgMatches(
  text: string,
  dictionary: NgIngredientRecord[],
): NgMatch[] {
  const normalized = normalizeText(text);
  const matches: NgMatch[] = [];

  for (const entry of dictionary) {
    const term = normalizeText(entry.term);
    if (term.length > 0 && normalized.includes(term)) {
      matches.push({
        category: entry.category,
        term: entry.term,
        note: entry.note,
      });
    }
  }

  return dedupeMatches(matches);
}

export function hasUnknownGelatin(text: string): boolean {
  const normalized = normalizeText(text);
  const hasGelatin = normalized.includes("ゼラチン") || normalized.includes("gelatin");
  if (!hasGelatin) {
    return false;
  }

  const explicitSafe =
    normalized.includes("植物") ||
    normalized.includes("plant") ||
    normalized.includes("魚") ||
    normalized.includes("fish");

  return !explicitSafe;
}

export function dedupeMatches(matches: NgMatch[]): NgMatch[] {
  const seen = new Set<string>();
  return matches.filter((match) => {
    const key = `${match.category}:${match.term}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function formatReason(match: NgMatch): string {
  return `${CATEGORY_LABELS[match.category]}: ${match.term}`;
}
