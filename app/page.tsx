import { ActionIcon } from "@/components/icons";
import { QuickActionCard } from "@/components/quick-action-card";
import { RecentScans } from "@/components/recent-scans";
import { getDictionary } from "@/lib/i18n/server";

export default async function HomePage() {
  const dict = await getDictionary();

  return (
    <div className="flex flex-col gap-6">
      <header className="rounded-2xl bg-gradient-to-br from-teal-900 to-teal-950 px-5 py-6 text-cream shadow-lg">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-saffron ring-1 ring-white/10">
            <ActionIcon name="halal" className="h-8 w-8" />
          </div>
          <div>
            <h1 className="font-latin text-3xl font-bold tracking-[0.04em] text-white">
              {dict.home.title}
            </h1>
            <p className="mt-1 text-sm text-cream/85">{dict.home.subtitle}</p>
          </div>
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-sm font-bold text-sage">{dict.home.quickActions}</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickActionCard
            href="/halal-scanner"
            label={dict.home.halalScanner}
            icon="halal"
            accent="saffron"
          />
          <QuickActionCard
            href="/cargo-check"
            label={dict.home.cargoCheck}
            icon="cargo"
            accent="teal"
          />
          <QuickActionCard
            href="/phrases"
            label={dict.home.phrases}
            icon="phrases"
            accent="teal"
          />
          <QuickActionCard
            href="/settings"
            label={dict.home.settings}
            icon="settings"
            accent="sand"
          />
        </div>
      </section>

      <RecentScans
        labels={{
          recentScans: dict.home.recentScans,
          noHistory: dict.home.noHistory,
          startScan: dict.home.startScan,
          historyHalal: dict.home.historyHalal,
          historyCargo: dict.home.historyCargo,
          historyPorkFound: dict.home.historyPorkFound,
          historyPorkNone: dict.home.historyPorkNone,
          verdictOk: dict.home.verdictOk,
          verdictAvoid: dict.home.verdictAvoid,
          verdictMaybe: dict.home.verdictMaybe,
        }}
      />
    </div>
  );
}
