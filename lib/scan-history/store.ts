import type { ScanHistoryEntry } from "./types";

export const SCAN_HISTORY_KEY = "safar_scan_history";
export const SCAN_HISTORY_UPDATED_EVENT = "safar:scan-history-updated";
export const MAX_SCAN_HISTORY = 20;

export function parseScanHistory(raw: string | null): ScanHistoryEntry[] {
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isScanHistoryEntry);
  } catch {
    return [];
  }
}

export function serializeScanHistory(entries: ScanHistoryEntry[]): string {
  return JSON.stringify(entries);
}

export function prependScanHistoryEntry(
  entries: ScanHistoryEntry[],
  entry: Omit<ScanHistoryEntry, "id" | "scannedAt">,
  max = MAX_SCAN_HISTORY,
): ScanHistoryEntry[] {
  const nextEntry: ScanHistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    scannedAt: new Date().toISOString(),
  };

  return [nextEntry, ...entries].slice(0, max);
}

export function getScanHistory(): ScanHistoryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  return parseScanHistory(localStorage.getItem(SCAN_HISTORY_KEY));
}

export function addScanHistoryEntry(
  entry: Omit<ScanHistoryEntry, "id" | "scannedAt">,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const current = getScanHistory();
  const next = prependScanHistoryEntry(current, entry);
  localStorage.setItem(SCAN_HISTORY_KEY, serializeScanHistory(next));
  window.dispatchEvent(new CustomEvent(SCAN_HISTORY_UPDATED_EVENT));
}

function isScanHistoryEntry(value: unknown): value is ScanHistoryEntry {
  if (!value || typeof value !== "object") {
    return false;
  }

  const entry = value as Partial<ScanHistoryEntry>;

  return (
    typeof entry.id === "string" &&
    (entry.type === "halal" || entry.type === "cargo") &&
    typeof entry.scannedAt === "string" &&
    typeof entry.title === "string" &&
    typeof entry.href === "string" &&
    (entry.jan === undefined || typeof entry.jan === "string") &&
    (entry.verdict === undefined ||
      entry.verdict === "ok" ||
      entry.verdict === "avoid" ||
      entry.verdict === "maybe") &&
    (entry.hasAnyPork === undefined || typeof entry.hasAnyPork === "boolean")
  );
}
