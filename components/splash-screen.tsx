"use client";

import { useEffect, useState } from "react";

const SPLASH_DURATION_MS = 2800;
const FADE_DURATION_MS = 500;
const SESSION_KEY = "safar_splash_seen";

type SplashScreenProps = {
  tagline: string;
  onComplete?: () => void;
};

function SafarMark() {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className="h-16 w-16 text-saffron"
    >
      <circle cx="32" cy="32" r="30" fill="currentColor" opacity="0.18" />
      <path
        d="M32 14 L38 28 L52 28 L41 37 L45 51 L32 42 L19 51 L23 37 L12 28 L26 28 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function SplashScreen({ tagline, onComplete }: SplashScreenProps) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  function finish() {
    sessionStorage.setItem(SESSION_KEY, "1");
    setFading(true);
    window.setTimeout(() => {
      setVisible(false);
      document.body.style.overflow = "";
      onComplete?.();
    }, FADE_DURATION_MS);
  }

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      onComplete?.();
      return;
    }

    setVisible(true);
    document.body.style.overflow = "hidden";

    const fadeTimer = window.setTimeout(() => {
      setFading(true);
    }, SPLASH_DURATION_MS);

    const hideTimer = window.setTimeout(finish, SPLASH_DURATION_MS + FADE_DURATION_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(hideTimer);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div
      className={`splash-screen fixed inset-0 z-[100] flex cursor-pointer flex-col items-center justify-center bg-gradient-to-br from-teal-900 via-teal-950 to-[#06201c] px-6 text-cream transition-opacity duration-500 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
      onClick={finish}
      role="dialog"
      aria-label="Safar"
    >
      <div
        className={`flex flex-col items-center text-center transition-transform duration-700 ${
          fading ? "scale-95" : "scale-100"
        }`}
      >
        <SafarMark />
        <p className="font-latin mt-6 text-5xl font-bold tracking-[0.04em] text-white">
          Safar
        </p>
        <p className="mt-3 text-sm font-medium text-cream/85">{tagline}</p>
        <div className="mt-10 h-1 w-24 overflow-hidden rounded-full bg-cream/15">
          <div className="splash-progress h-full rounded-full bg-saffron" />
        </div>
      </div>
    </div>
  );
}
