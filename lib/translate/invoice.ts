import { invoiceGlossary, type GlossaryEntry } from "./glossary";

export type TranslatedLine = {
  original: string;
  translated: string;
};

export type InvoiceTranslationResult = {
  lines: TranslatedLine[];
  fullText: string;
};

function sortGlossary(entries: GlossaryEntry[]): GlossaryEntry[] {
  return [...entries].sort((a, b) => b.ja.length - a.ja.length);
}

export function translateInvoiceLine(line: string, glossary: GlossaryEntry[] = invoiceGlossary): string {
  let translated = line;
  const sorted = sortGlossary(glossary);

  for (const entry of sorted) {
    if (translated.includes(entry.ja)) {
      translated = translated.split(entry.ja).join(entry.ru);
    }
  }

  return translated;
}

export function translateInvoiceText(text: string): InvoiceTranslationResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((original) => ({
      original,
      translated: translateInvoiceLine(original),
    }));

  return {
    lines,
    fullText: lines.map((line) => line.translated).join("\n"),
  };
}
