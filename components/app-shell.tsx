import Link from "next/link";
import { LaunchFlow } from "@/components/launch-flow";
import type { WalkthroughLabels } from "@/lib/i18n/walkthrough-labels";
import type { Locale } from "@/lib/i18n/types";

type AppShellProps = {
  children: React.ReactNode;
  locale: Locale;
  splashTagline: string;
  walkthroughLabels: WalkthroughLabels;
  shouldRedirectToOnboarding: boolean;
};

export function AppShell({
  children,
  locale,
  splashTagline,
  walkthroughLabels,
  shouldRedirectToOnboarding,
}: AppShellProps) {
  return (
    <>
      <LaunchFlow
        splashTagline={splashTagline}
        walkthroughLabels={walkthroughLabels}
        shouldRedirectToOnboarding={shouldRedirectToOnboarding}
      />
      <div className="mx-auto min-h-dvh max-w-lg bg-sand px-4 pb-8 pt-4">
        <nav className="mb-4 flex items-center justify-between rounded-2xl border border-[var(--line)] bg-card px-4 py-3">
          <Link href="/" className="font-latin text-lg font-bold text-teal-900">
            Safar
          </Link>
          <div className="flex items-center gap-3 text-sm font-medium text-sage">
            <Link href="/halal-scanner" className="hover:text-teal-800">
              Scan
            </Link>
            <Link href="/cargo-check" className="hover:text-teal-800">
              Cargo
            </Link>
            <Link href="/phrases" className="hover:text-teal-800">
              Phrases
            </Link>
            <Link href="/onboarding" className="hover:text-teal-800">
              {locale.toUpperCase()}
            </Link>
          </div>
        </nav>
        <main>{children}</main>
      </div>
    </>
  );
}
