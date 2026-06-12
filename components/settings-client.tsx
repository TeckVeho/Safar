"use client";

import { useEffect, useState } from "react";
import { ActionIcon } from "@/components/icons";
import type { Locale } from "@/lib/i18n/types";

type SettingsLabels = {
  languageTitle: string;
  languageDescription: string;
  privacyTitle: string;
  privacyDescription: string;
  locationConsent: string;
  locationConsentHint: string;
  consentGranted: string;
  consentRevoked: string;
  languages: Record<Locale, string>;
};

type SettingsClientProps = {
  labels: SettingsLabels;
  currentLocale: Locale;
  setLocaleAction: (formData: FormData) => Promise<void>;
};

const LOCATION_CONSENT_KEY = "safar_location_consent";

export function SettingsClient({
  labels,
  currentLocale,
  setLocaleAction,
}: SettingsClientProps) {
  const [locationConsent, setLocationConsent] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(LOCATION_CONSENT_KEY);
    setLocationConsent(stored === "granted");
  }, []);

  function toggleLocationConsent() {
    const next = !locationConsent;
    setLocationConsent(next);
    localStorage.setItem(LOCATION_CONSENT_KEY, next ? "granted" : "revoked");
  }

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-2xl border border-[var(--line)] bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand-2 text-teal-800">
            <ActionIcon name="language" className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink">{labels.languageTitle}</h2>
            <p className="mt-1 text-sm text-sage">{labels.languageDescription}</p>
          </div>
        </div>

        <form action={setLocaleAction} className="mt-4 grid gap-2">
          {(["ru", "ja"] as Locale[]).map((locale) => (
            <button
              key={locale}
              type="submit"
              name="locale"
              value={locale}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-bold transition ${
                currentLocale === locale
                  ? "border-saffron bg-[#fff7ea] text-ink"
                  : "border-[var(--line)] bg-white text-sage hover:border-teal-800"
              }`}
            >
              {labels.languages[locale]}
              {currentLocale === locale ? (
                <span className="text-xs text-saffron-deep">✓</span>
              ) : null}
            </button>
          ))}
        </form>
      </section>

      <section className="rounded-2xl border border-[var(--line)] bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand-2 text-teal-800">
            <ActionIcon name="settings" className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-ink">{labels.privacyTitle}</h2>
            <p className="mt-1 text-sm text-sage">{labels.privacyDescription}</p>
          </div>
        </div>

        <label className="mt-4 flex items-start gap-3 rounded-xl border border-[var(--line)] bg-white p-4">
          <input
            type="checkbox"
            checked={locationConsent}
            onChange={toggleLocationConsent}
            className="mt-1 h-4 w-4 accent-teal-800"
          />
          <span>
            <span className="block text-sm font-bold text-ink">{labels.locationConsent}</span>
            <span className="mt-1 block text-xs text-sage">{labels.locationConsentHint}</span>
            <span className="mt-2 block text-xs font-medium text-teal-800">
              {locationConsent ? labels.consentGranted : labels.consentRevoked}
            </span>
          </span>
        </label>
      </section>
    </div>
  );
}
