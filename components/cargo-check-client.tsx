"use client";

import { useState } from "react";
import { BarcodeScanner, type BarcodeScannerLabels } from "@/components/barcode-scanner";
import { ActionIcon } from "@/components/icons";
import { createCargoHistoryEntry } from "@/lib/scan-history/create-entry";
import { addScanHistoryEntry } from "@/lib/scan-history/store";

type CargoCheckLabels = {
  janLabel: string;
  janPlaceholder: string;
  itemsLabel: string;
  itemsPlaceholder: string;
  checkButton: string;
  alertTitle: string;
  alertDescription: string;
  noPorkTitle: string;
  noPorkDescription: string;
  optionsTitle: string;
  optionGloves: string;
  optionContact: string;
  optionSubstitute: string;
  itemLabel: string;
  reasons: string;
  sampleHint: string;
  error: string;
};

type CargoItem = {
  line: string;
  jan?: string;
  productName?: string;
  hasPork: boolean;
  reasons: Array<{ label: string }>;
};

type CargoHistoryLabels = {
  itemList: string;
  ingredientsCheck: string;
};

type CargoCheckClientProps = {
  labels: CargoCheckLabels;
  scannerLabels: BarcodeScannerLabels;
  historyLabels: CargoHistoryLabels;
};

export function CargoCheckClient({
  labels,
  scannerLabels,
  historyLabels,
}: CargoCheckClientProps) {
  const [jan, setJan] = useState("");
  const [itemsText, setItemsText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CargoItem[]>([]);
  const [hasAnyPork, setHasAnyPork] = useState<boolean | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);

  async function runCheck(janValue: string, itemsValue: string) {
    if (!janValue && !itemsValue) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/cargo/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jan: janValue || undefined,
          itemsText: itemsValue || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("request failed");
      }

      const data = (await response.json()) as {
        items: CargoItem[];
        hasAnyPork: boolean;
      };

      setItems(data.items);
      setHasAnyPork(data.hasAnyPork);
      addScanHistoryEntry(
        createCargoHistoryEntry({
          jan: janValue,
          itemsText: itemsValue,
          items: data.items,
          hasAnyPork: data.hasAnyPork,
          itemListLabel: (count) =>
            historyLabels.itemList.replace("{count}", String(count)),
          ingredientsFallbackLabel: historyLabels.ingredientsCheck,
        }),
      );
    } catch {
      setError(labels.error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runCheck(jan.trim(), itemsText.trim());
  }

  async function handleJanScan(scannedJan: string) {
    setJan(scannedJan);
    await runCheck(scannedJan, itemsText.trim());
  }

  const porkItems = items.filter((item) => item.hasPork);

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
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-teal-800"
            />
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              disabled={loading}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-teal-800/30 bg-teal-800/10 px-4 py-2 text-sm font-bold text-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <ActionIcon name="cargo" className="h-4 w-4" />
              {scannerLabels.scanButton}
            </button>
          </div>
        </div>

        <label className="mt-4 block text-sm font-bold text-ink">
          {labels.itemsLabel}
          <textarea
            value={itemsText}
            onChange={(event) => setItemsText(event.target.value)}
            placeholder={labels.itemsPlaceholder}
            rows={5}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-teal-800"
          />
        </label>

        <button
          type="submit"
          disabled={loading || (!jan.trim() && !itemsText.trim())}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-800 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ActionIcon name="cargo" className="h-5 w-5" />
          {loading ? "…" : labels.checkButton}
        </button>

        <p className="mt-3 text-xs text-sage">{labels.sampleHint}</p>
      </form>

      <BarcodeScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScan={handleJanScan}
        labels={scannerLabels}
        accent="teal"
      />

      {error ? <p className="text-sm font-medium text-[var(--verdict-avoid)]">{error}</p> : null}

      {hasAnyPork === false ? (
        <section className="rounded-2xl border border-[var(--verdict-ok)]/20 bg-[var(--verdict-ok-bg)]/40 p-4">
          <p className="font-bold text-[var(--verdict-ok)]">{labels.noPorkTitle}</p>
          <p className="mt-2 text-sm text-sage">{labels.noPorkDescription}</p>
        </section>
      ) : null}

      {hasAnyPork ? (
        <section className="rounded-2xl border border-[var(--verdict-avoid)]/30 bg-[var(--verdict-avoid-bg)]/40 p-4">
          <p className="font-bold text-[var(--verdict-avoid)]">{labels.alertTitle}</p>
          <p className="mt-2 text-sm text-sage">{labels.alertDescription}</p>

          <div className="mt-4 space-y-3">
            {porkItems.map((item) => (
              <div
                key={`${item.line}-${item.jan ?? "no-jan"}`}
                className="rounded-xl border border-[var(--verdict-avoid)]/20 bg-white/70 p-3"
              >
                <p className="text-sm font-bold text-ink">
                  {item.productName ?? item.line}
                </p>
                {item.jan ? (
                  <p className="mt-1 text-xs text-sage">
                    {labels.itemLabel}: {item.jan}
                  </p>
                ) : null}
                {item.reasons.length > 0 ? (
                  <ul className="mt-2 space-y-1 text-sm">
                    {item.reasons.map((reason) => (
                      <li key={reason.label}>• {reason.label}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>

          <div className="mt-4 rounded-xl bg-white/60 p-3">
            <p className="text-xs font-bold uppercase tracking-wide text-sage">
              {labels.optionsTitle}
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              <li>• {labels.optionContact}</li>
              <li>• {labels.optionGloves}</li>
              <li>• {labels.optionSubstitute}</li>
            </ul>
          </div>
        </section>
      ) : null}
    </div>
  );
}
