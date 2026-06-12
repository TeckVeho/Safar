"use client";

import { useState } from "react";
import { BarcodeScanner, type BarcodeScannerLabels } from "@/components/barcode-scanner";
import { ActionIcon } from "@/components/icons";
import { VerdictCard } from "@/components/verdict-card";
import type { Verdict } from "@/lib/halal/types";
import { createHalalHistoryEntry } from "@/lib/scan-history/create-entry";
import { addScanHistoryEntry } from "@/lib/scan-history/store";

type HalalScannerLabels = {
  janLabel: string;
  janPlaceholder: string;
  ingredientsLabel: string;
  ingredientsPlaceholder: string;
  scanButton: string;
  verdictOk: string;
  verdictAvoid: string;
  verdictMaybe: string;
  userMustConfirm: string;
  reasons: string;
  sampleHint: string;
};

type JudgeResponse = {
  verdict: Verdict;
  productName?: string;
  reasons: Array<{ label: string }>;
  userMustConfirm: boolean;
};

type HalalScannerClientProps = {
  labels: HalalScannerLabels;
  scannerLabels: BarcodeScannerLabels;
};

export function HalalScannerClient({ labels, scannerLabels }: HalalScannerClientProps) {
  const [jan, setJan] = useState("");
  const [ingredientsText, setIngredientsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<JudgeResponse | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  async function runJudge(janValue: string, ingredientsValue: string) {
    if (!janValue && !ingredientsValue) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/halal/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jan: janValue || undefined,
          ingredientsText: ingredientsValue || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("request failed");
      }

      const data = (await response.json()) as JudgeResponse;
      setResult(data);
      addScanHistoryEntry(
        createHalalHistoryEntry({
          jan: janValue,
          productName: data.productName,
          ingredientsText: ingredientsValue,
          verdict: data.verdict,
        }),
      );
    } catch {
      setError("判定に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runJudge(jan.trim(), ingredientsText.trim());
  }

  async function handleJanScan(scannedJan: string) {
    setJan(scannedJan);
    await runJudge(scannedJan, ingredientsText.trim());
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--line)] bg-card p-4">
        <div className="block text-sm font-bold text-ink">
          {labels.janLabel}
          <div className="mt-2 flex flex-col gap-2 sm:flex-row">
            <input
              value={jan}
              onChange={(event) => setJan(event.target.value)}
              placeholder={labels.janPlaceholder}
              inputMode="numeric"
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-saffron"
            />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              disabled={loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-saffron/40 bg-saffron/10 px-4 py-2 text-sm font-bold text-[#3a2408] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ActionIcon name="halal" className="h-4 w-4" />
              {scannerLabels.scanButton}
            </button>
          </div>
        </div>

        <label className="mt-4 block text-sm font-bold text-ink">
          {labels.ingredientsLabel}
          <textarea
            value={ingredientsText}
            onChange={(event) => setIngredientsText(event.target.value)}
            placeholder={labels.ingredientsPlaceholder}
            rows={4}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-saffron"
          />
        </label>

        <button
          type="submit"
          disabled={loading || (!jan.trim() && !ingredientsText.trim())}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-saffron px-4 py-3 text-sm font-bold text-[#3a2408] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ActionIcon name="halal" className="h-5 w-5" />
          {loading ? "…" : labels.scanButton}
        </button>

        <p className="mt-3 text-xs text-sage">{labels.sampleHint}</p>
      </form>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleJanScan}
        labels={scannerLabels}
        accent="saffron"
      />

      {error ? <p className="text-sm font-medium text-[var(--verdict-avoid)]">{error}</p> : null}

      {result ? (
        <VerdictCard
          verdict={result.verdict}
          productName={result.productName}
          reasons={result.reasons}
          labels={labels}
          userMustConfirm={result.userMustConfirm}
        />
      ) : null}
    </div>
  );
}
