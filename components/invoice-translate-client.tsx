"use client";

import { useState } from "react";
import { ActionIcon } from "@/components/icons";

type InvoiceTranslateLabels = {
  inputLabel: string;
  inputPlaceholder: string;
  translateButton: string;
  originalLabel: string;
  translatedLabel: string;
  hint: string;
  error: string;
};

type TranslatedLine = {
  original: string;
  translated: string;
};

type InvoiceTranslateClientProps = {
  labels: InvoiceTranslateLabels;
};

export function InvoiceTranslateClient({ labels }: InvoiceTranslateClientProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<TranslatedLine[]>([]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/translate/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!response.ok) {
        throw new Error("request failed");
      }

      const data = (await response.json()) as { lines: TranslatedLine[] };
      setLines(data.lines);
    } catch {
      setError(labels.error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form onSubmit={handleSubmit} className="rounded-2xl border border-[var(--line)] bg-card p-4">
        <label className="block text-sm font-bold text-ink">
          {labels.inputLabel}
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder={labels.inputPlaceholder}
            rows={6}
            className="mt-2 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm outline-none focus:border-teal-800"
          />
        </label>

        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-teal-800 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          <ActionIcon name="phrases" className="h-5 w-5" />
          {loading ? "…" : labels.translateButton}
        </button>

        <p className="mt-3 text-xs text-sage">{labels.hint}</p>
      </form>

      {error ? <p className="text-sm font-medium text-[var(--verdict-avoid)]">{error}</p> : null}

      {lines.length > 0 ? (
        <div className="space-y-3">
          {lines.map((line) => (
            <article
              key={line.original}
              className="rounded-2xl border border-[var(--line)] bg-card p-4"
            >
              <p className="text-xs font-bold uppercase tracking-wide text-sage">
                {labels.originalLabel}
              </p>
              <p className="mt-1 text-sm text-ink">{line.original}</p>
              <p className="mt-3 text-xs font-bold uppercase tracking-wide text-sage">
                {labels.translatedLabel}
              </p>
              <p className="mt-1 text-sm font-medium text-teal-900">{line.translated}</p>
            </article>
          ))}
        </div>
      ) : null}
    </div>
  );
}
