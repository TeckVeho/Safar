"use client";

import { useEffect, useState } from "react";
import { ActionIcon } from "@/components/icons";

type PhraseCategory = "tenko" | "denpyo" | "niyaku" | "ninushi" | "jiko";

type Phrase = {
  id: number;
  category: PhraseCategory;
  ja: string;
  ru: string;
};

type PhrasesLabels = {
  categories: Record<PhraseCategory, string>;
  japanese: string;
  russian: string;
  speak: string;
  loading: string;
  error: string;
  empty: string;
  translateLink: string;
};

type PhrasesClientProps = {
  labels: PhrasesLabels;
  translateHref: string;
};

const categoryOrder: PhraseCategory[] = ["tenko", "denpyo", "niyaku", "ninushi", "jiko"];

export function PhrasesClient({ labels, translateHref }: PhrasesClientProps) {
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [activeCategory, setActiveCategory] = useState<PhraseCategory>("tenko");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPhrases() {
      try {
        const response = await fetch("/api/phrases");
        if (!response.ok) {
          throw new Error("request failed");
        }
        const data = (await response.json()) as { phrases: Phrase[] };
        setPhrases(data.phrases);
      } catch {
        setError(labels.error);
      } finally {
        setLoading(false);
      }
    }

    loadPhrases();
  }, [labels.error]);

  const filtered = phrases.filter((phrase) => phrase.category === activeCategory);

  function speak(text: string, lang: "ja-JP" | "ru-RU") {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    window.speechSynthesis.speak(utterance);
  }

  return (
    <div className="flex flex-col gap-4">
      <a
        href={translateHref}
        className="inline-flex items-center gap-2 rounded-2xl border border-[var(--line)] bg-card px-4 py-3 text-sm font-bold text-teal-800 transition hover:border-teal-800"
      >
        <ActionIcon name="phrases" className="h-5 w-5" />
        {labels.translateLink}
      </a>

      <div className="flex flex-wrap gap-2">
        {categoryOrder.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setActiveCategory(category)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              activeCategory === category
                ? "bg-teal-800 text-white"
                : "border border-[var(--line)] bg-card text-sage"
            }`}
          >
            {labels.categories[category]}
          </button>
        ))}
      </div>

      {loading ? <p className="text-sm text-sage">{labels.loading}</p> : null}
      {error ? <p className="text-sm font-medium text-[var(--verdict-avoid)]">{error}</p> : null}

      {!loading && !error && filtered.length === 0 ? (
        <p className="text-sm text-sage">{labels.empty}</p>
      ) : null}

      <div className="space-y-3">
        {filtered.map((phrase) => (
          <article
            key={phrase.id}
            className="rounded-2xl border border-[var(--line)] bg-card p-4"
          >
            <div className="space-y-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-sage">
                  {labels.japanese}
                </p>
                <p className="mt-1 text-sm font-medium text-ink">{phrase.ja}</p>
                <button
                  type="button"
                  onClick={() => speak(phrase.ja, "ja-JP")}
                  className="mt-2 text-xs font-bold text-teal-800"
                >
                  {labels.speak}
                </button>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-sage">
                  {labels.russian}
                </p>
                <p className="mt-1 text-sm font-medium text-ink">{phrase.ru}</p>
                <button
                  type="button"
                  onClick={() => speak(phrase.ru, "ru-RU")}
                  className="mt-2 text-xs font-bold text-teal-800"
                >
                  {labels.speak}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
