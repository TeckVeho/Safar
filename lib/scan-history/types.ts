import type { Verdict } from "@/lib/halal/types";

export type ScanHistoryType = "halal" | "cargo";

export type ScanHistoryEntry = {
  id: string;
  type: ScanHistoryType;
  scannedAt: string;
  jan?: string;
  title: string;
  verdict?: Verdict;
  hasAnyPork?: boolean;
  href: string;
};
