export function parseJanFromBarcode(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  const digitsOnly = trimmed.replace(/\D/g, "");

  if (digitsOnly.length === 13) {
    return digitsOnly;
  }

  if (digitsOnly.length === 12) {
    return `0${digitsOnly}`;
  }

  const embedded = trimmed.match(/\b(\d{13})\b/);
  return embedded ? embedded[1] : null;
}
