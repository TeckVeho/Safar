"use client";

import { useCallback, useEffect, useState } from "react";
import { SplashScreen } from "@/components/splash-screen";
import {
  WalkthroughScreen,
  isWalkthroughCompleted,
} from "@/components/walkthrough-screen";
import type { WalkthroughLabels } from "@/lib/i18n/walkthrough-labels";

const SPLASH_SESSION_KEY = "safar_splash_seen";

type LaunchPhase = "splash" | "walkthrough" | "idle";

type LaunchFlowProps = {
  splashTagline: string;
  walkthroughLabels: WalkthroughLabels;
  shouldRedirectToOnboarding: boolean;
};

export function LaunchFlow({
  splashTagline,
  walkthroughLabels,
  shouldRedirectToOnboarding,
}: LaunchFlowProps) {
  const [phase, setPhase] = useState<LaunchPhase>("splash");
  const [ready, setReady] = useState(false);

  const goToNextPhase = useCallback(() => {
    if (!isWalkthroughCompleted()) {
      setPhase("walkthrough");
      return;
    }
    setPhase("idle");
  }, []);

  useEffect(() => {
    const splashSeen = sessionStorage.getItem(SPLASH_SESSION_KEY) === "1";
    setPhase(
      splashSeen
        ? isWalkthroughCompleted()
          ? "idle"
          : "walkthrough"
        : "splash",
    );
    setReady(true);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <>
      {phase === "splash" ? (
        <SplashScreen tagline={splashTagline} onComplete={goToNextPhase} />
      ) : null}

      {phase === "walkthrough" ? (
        <WalkthroughScreen
          labels={walkthroughLabels}
          shouldRedirectToOnboarding={shouldRedirectToOnboarding}
          onComplete={() => setPhase("idle")}
        />
      ) : null}
    </>
  );
}
