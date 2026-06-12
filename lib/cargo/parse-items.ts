const JAN_PATTERN = /\b(\d{13})\b/g;

export type ParsedCargoLine = {
  line: string;
  jan?: string;
};

export function parseCargoLines(text: string): ParsedCargoLine[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const janMatch = line.match(JAN_PATTERN);
      return {
        line,
        jan: janMatch?.[0],
      };
    });
}
