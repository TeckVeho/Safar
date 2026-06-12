"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ActionIcon } from "@/components/icons";
import {
  getScanHistory,
  SCAN_HISTORY_UPDATED_EVENT,
} from "@/lib/scan-history/store";
import type { ScanHistoryEntry } from "@/lib/scan-history/types";

type RecentScansLabels = {
  recentScans: string;
  noHistory: string;
  startScan: string;
  historyHalal: string;
  historyCargo: string;
  historyPorkFound: string;
  historyPorkNone: string;
  verdictOk: string;
  verdictAvoid: string;
  verdictMaybe: string;
};

type RecentScansProps = {
  labels: RecentScansLabels;
};

export function RecentScans({ labels }: RecentScansProps) {
  const [entries, setEntries] = useState<ScanHistoryEntry[]>([]);

  useEffect(() => {
    function loadHistory() {
      setEntries(getScanHistory());
    }

    loadHistory();
    window.addEventListener(SCAN_HISTORY_UPDATED_EVENT, loadHistory);
    return () => window.removeEventListener(SCAN_HISTORY_UPDATED_EVENT, loadHistory);
  }, []);

  return (
    <section className="rounded-2xl border border-[var(--line)] bg-card p-4">
      <h2 className="text-sm font-bold text-sage">{labels.recentScans}</h2>

      {entries.length === 0 ? (
        <>
          <p className="mt-3 text-sm text-sage">{labels.noHistory}</p>
          <Link
            href="/halal-scanner"
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-saffron px-4 py-2 text-sm font-bold text-[#3a2408]"
          >
            <ActionIcon name="halal" className="h-5 w-5" />
            {labels.startScan}
          </Link>
        </>
      ) : (
        <ul className="mt-3 space-y-2">
          {entries.map((entry) => (
            <li key={entry.id}>
              <Link
                href={entry.href}
                className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-white/70 px-3 py-3 transition hover:border-saffron/40"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-ink">{entry.title}</p>
                  <p className="mt-1 text-xs text-sage">
                    {entry.type === "halal" ? labels.historyHalal : labels.historyCargo}
                    {entry.jan ? ` · JAN ${entry.jan}` : ""}
                    {" · "}
                    {formatScannedAt(entry.scannedAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-bold ${getBadgeClass(entry, labels)}`}
                >
                  {getBadgeLabel(entry, labels)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function getBadgeLabel(entry: ScanHistoryEntry, labels: RecentScansLabels): string {
  if (entry.type === "halal" && entry.verdict) {
    if (entry.verdict === "ok") {
      return labels.verdictOk;
    }
    if (entry.verdict === "avoid") {
      return labels.verdictAvoid;
    }
    return labels.verdictMaybe;
  }

  if (entry.type === "cargo") {
    return entry.hasAnyPork ? labels.historyPorkFound : labels.historyPorkNone;
  }

  return labels.verdictMaybe;
}

function getBadgeClass(entry: ScanHistoryEntry, labels: RecentScansLabels): string {
  const label = getBadgeLabel(entry, labels);

  if (label === labels.verdictOk || label === labels.historyPorkNone) {
    return "bg-[var(--verdict-ok-bg)] text-[var(--verdict-ok)]";
  }

  if (label === labels.verdictAvoid || label === labels.historyPorkFound) {
    return "bg-[var(--verdict-avoid-bg)] text-[var(--verdict-avoid)]";
  }

  return "bg-[var(--verdict-maybe-bg)] text-[var(--verdict-maybe)]";
}

function formatScannedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
