"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ActionIcon, type ActionIconName } from "@/components/icons";
import type { WalkthroughLabels } from "@/lib/i18n/walkthrough-labels";

const WALKTHROUGH_KEY = "safar_walkthrough_completed";

type SlideKey = keyof WalkthroughLabels["slides"];

const slideOrder: SlideKey[] = ["cargo", "halal", "phrases"];

const slideIcons: Record<SlideKey, ActionIconName> = {
  cargo: "cargo",
  halal: "halal",
  phrases: "phrases",
};

const slideAccents: Record<SlideKey, string> = {
  cargo: "from-teal-800/20 to-teal-900/10 text-teal-800",
  halal: "from-[#fff1dc] to-[#fff7ea] text-saffron-deep",
  phrases: "from-[#edf5f3] to-[#e3efec] text-teal-800",
};

type WalkthroughScreenProps = {
  labels: WalkthroughLabels;
  shouldRedirectToOnboarding: boolean;
  onComplete: () => void;
};

export function isWalkthroughCompleted(): boolean {
  if (typeof window === "undefined") {
    return true;
  }
  return localStorage.getItem(WALKTHROUGH_KEY) === "1";
}

export function WalkthroughScreen({
  labels,
  shouldRedirectToOnboarding,
  onComplete,
}: WalkthroughScreenProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);

  const currentKey = slideOrder[step];
  const isLast = step === slideOrder.length - 1;
  const slide = labels.slides[currentKey];

  const finish = useCallback(() => {
    localStorage.setItem(WALKTHROUGH_KEY, "1");
    setVisible(false);
    document.body.style.overflow = "";
    onComplete();

    if (shouldRedirectToOnboarding) {
      router.push("/onboarding");
    }
  }, [onComplete, router, shouldRedirectToOnboarding]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  function handleNext() {
    if (isLast) {
      finish();
      return;
    }
    setStep((current) => current + 1);
  }

  if (!visible) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[99] flex flex-col bg-gradient-to-br from-teal-900 via-teal-950 to-[#06201c] text-cream"
      role="dialog"
      aria-label="Walkthrough"
    >
      <div className="flex items-center justify-between px-5 pt-5">
        <p className="font-latin text-xs font-semibold uppercase tracking-[0.18em] text-saffron">
          Safar
        </p>
        <button
          type="button"
          onClick={finish}
          className="rounded-full px-3 py-1.5 text-sm font-medium text-cream/80 transition hover:bg-white/10 hover:text-white"
        >
          {labels.skip}
        </button>
      </div>

      <button
        type="button"
        onClick={handleNext}
        className="flex flex-1 flex-col items-center justify-center px-8 text-center"
      >
        <div
          className={`flex h-28 w-28 items-center justify-center rounded-3xl bg-gradient-to-br shadow-lg ring-1 ring-white/10 ${slideAccents[currentKey]}`}
        >
          <ActionIcon name={slideIcons[currentKey]} className="h-14 w-14" />
        </div>

        <h2 className="mt-8 text-2xl font-bold text-white">{slide.title}</h2>
        <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/85">
          {slide.description}
        </p>

        <p className="mt-8 text-xs font-medium text-cream/50">{labels.tapHint}</p>
      </button>

      <div className="flex flex-col items-center gap-5 px-6 pb-10">
        <div className="flex items-center gap-2">
          {slideOrder.map((key, index) => (
            <span
              key={key}
              className={`h-2 rounded-full transition-all ${
                index === step ? "w-6 bg-saffron" : "w-2 bg-cream/25"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="w-full max-w-sm rounded-full bg-saffron px-6 py-3 text-sm font-bold text-[#3a2408] shadow-lg"
        >
          {isLast ? labels.start : labels.next}
        </button>
      </div>
    </div>
  );
}
