export type Locale = "ja" | "ru";

export const LOCALE_COOKIE = "safar_locale";
export const DEFAULT_LOCALE: Locale = "ru";

export type PhraseCategoryKey = "tenko" | "denpyo" | "niyaku" | "ninushi" | "jiko";

export type Dictionary = {
  nav: {
    home: string;
    halalScanner: string;
    cargoCheck: string;
    phrases: string;
    settings: string;
    onboarding: string;
  };
  common: {
    back: string;
    backHome: string;
    comingSoon: string;
    skip: string;
    loading: string;
    error: string;
  };
  barcodeScanner: {
    title: string;
    hint: string;
    close: string;
    starting: string;
    cameraError: string;
    invalidJan: string;
    scanButton: string;
  };
  home: {
    title: string;
    subtitle: string;
    quickActions: string;
    halalScanner: string;
    cargoCheck: string;
    phrases: string;
    settings: string;
    recentScans: string;
    noHistory: string;
    startScan: string;
    historyHalal: string;
    historyCargo: string;
    historyPorkFound: string;
    historyPorkNone: string;
    historyItemList: string;
    historyIngredientsCheck: string;
    verdictOk: string;
    verdictAvoid: string;
    verdictMaybe: string;
  };
  halalScanner: {
    eyebrow: string;
    title: string;
    description: string;
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
  cargoCheck: {
    eyebrow: string;
    description: string;
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
  phrases: {
    eyebrow: string;
    description: string;
    categories: Record<PhraseCategoryKey, string>;
    japanese: string;
    russian: string;
    speak: string;
    loading: string;
    error: string;
    empty: string;
    translateLink: string;
  };
  invoiceTranslate: {
    eyebrow: string;
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    translateButton: string;
    originalLabel: string;
    translatedLabel: string;
    hint: string;
    error: string;
  };
  settings: {
    eyebrow: string;
    description: string;
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
  onboarding: {
    title: string;
    subtitle: string;
    languages: Record<Locale, string>;
  };
  splash: {
    tagline: string;
  };
  walkthrough: {
    skip: string;
    next: string;
    start: string;
    tapHint: string;
    slides: {
      cargo: { title: string; description: string };
      halal: { title: string; description: string };
      phrases: { title: string; description: string };
    };
  };
};
