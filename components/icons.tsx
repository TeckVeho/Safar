type IconProps = {
  className?: string;
};

export function ChevronLeftIcon({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export function HalalScanIcon({ className = "h-7 w-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect x="4" y="7" width="24" height="18" rx="3" stroke="currentColor" strokeWidth="2" />
      <path d="M8 12h3M8 16h2M8 20h3M14 12h10M14 16h8M14 20h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="24" cy="9" r="5" fill="currentColor" />
      <path d="M22.2 9l1.2 1.2 2.6-2.6" stroke="#fcf9f2" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CargoCheckIcon({ className = "h-7 w-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path d="M6 12h20l-2 14H8L6 12Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M11 12V9a5 5 0 0 1 10 0v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M13 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function PhrasesIcon({ className = "h-7 w-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 8h16a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-3l-4 4v-4H8a3 3 0 0 1-3-3v-8a3 3 0 0 1 3-3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M11 14h10M11 18h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SettingsIcon({ className = "h-7 w-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M16 4v3M16 25v3M4 16h3M25 16h3M7.8 7.8l2.1 2.1M22.1 22.1l2.1 2.1M7.8 24.2l2.1-2.1M22.1 9.9l2.1-2.1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LanguageIcon({ className = "h-7 w-7" }: IconProps) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <circle cx="16" cy="16" r="11" stroke="currentColor" strokeWidth="2" />
      <path d="M5 16h22M16 5c3 3.5 4.5 7.5 4.5 11S19 23.5 16 27M16 5c-3 3.5-4.5 7.5-4.5 11S13 23.5 16 27" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export type ActionIconName = "halal" | "cargo" | "phrases" | "settings" | "language";

const actionIcons: Record<ActionIconName, typeof HalalScanIcon> = {
  halal: HalalScanIcon,
  cargo: CargoCheckIcon,
  phrases: PhrasesIcon,
  settings: SettingsIcon,
  language: LanguageIcon,
};

export function ActionIcon({
  name,
  className,
}: IconProps & { name: ActionIconName }) {
  const Icon = actionIcons[name];
  return <Icon className={className} />;
}
