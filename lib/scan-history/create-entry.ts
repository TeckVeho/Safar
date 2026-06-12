import type { Verdict } from "@/lib/halal/types";
import type { ScanHistoryEntry } from "./types";

type HalalHistoryInput = {
  jan?: string;
  productName?: string;
  ingredientsText?: string;
  verdict: Verdict;
};

type CargoHistoryInput = {
  jan?: string;
  itemsText?: string;
  items: Array<{ productName?: string; line: string }>;
  hasAnyPork: boolean;
  itemListLabel: (count: number) => string;
  ingredientsFallbackLabel: string;
};

export function createHalalHistoryEntry(
  input: HalalHistoryInput,
): Omit<ScanHistoryEntry, "id" | "scannedAt"> {
  const title =
    input.productName?.trim() ||
    (input.jan?.trim() ? `JAN ${input.jan.trim()}` : undefined) ||
    truncateText(input.ingredientsText, 24) ||
    "Halal scan";

  return {
    type: "halal",
    jan: input.jan?.trim() || undefined,
    title,
    verdict: input.verdict,
    href: "/halal-scanner",
  };
}

export function createCargoHistoryEntry(
  input: CargoHistoryInput,
): Omit<ScanHistoryEntry, "id" | "scannedAt"> {
  const jan = input.jan?.trim();
  const firstItem = input.items[0];
  const title = jan
    ? firstItem?.productName?.trim() || `JAN ${jan}`
    : input.items.length > 1
      ? input.itemListLabel(input.items.length)
      : firstItem?.productName?.trim() ||
        truncateText(firstItem?.line, 24) ||
        truncateText(input.itemsText, 24) ||
        input.ingredientsFallbackLabel;

  return {
    type: "cargo",
    jan: jan || firstItem?.line.match(/\b\d{13}\b/)?.[0],
    title,
    hasAnyPork: input.hasAnyPork,
    href: "/cargo-check",
  };
}

function truncateText(value: string | undefined, maxLength: number): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.length <= maxLength) {
    return trimmed;
  }

  return `${trimmed.slice(0, maxLength)}…`;
}
