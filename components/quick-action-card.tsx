import Link from "next/link";
import { ActionIcon, type ActionIconName } from "@/components/icons";

type QuickActionCardProps = {
  href: string;
  label: string;
  icon: ActionIconName;
  accent: "saffron" | "teal" | "sand";
  disabled?: boolean;
};

const accentClasses: Record<
  QuickActionCardProps["accent"],
  { card: string; iconWrap: string; iconColor: string }
> = {
  saffron: {
    card: "border-saffron/30 bg-gradient-to-br from-card to-[#fff7ea]",
    iconWrap: "bg-[#fff1dc]",
    iconColor: "text-saffron-deep",
  },
  teal: {
    card: "border-teal-800/15 bg-gradient-to-br from-card to-[#edf5f3]",
    iconWrap: "bg-[#e3efec]",
    iconColor: "text-teal-800",
  },
  sand: {
    card: "border-[var(--line)] bg-card",
    iconWrap: "bg-sand-2",
    iconColor: "text-sage",
  },
};

export function QuickActionCard({
  href,
  label,
  icon,
  accent,
  disabled = false,
}: QuickActionCardProps) {
  const styles = accentClasses[accent];
  const className = `flex min-h-[7.5rem] flex-col justify-between rounded-2xl border p-4 text-left transition ${styles.card} ${
    disabled ? "opacity-50" : "hover:-translate-y-0.5 hover:shadow-md"
  }`;

  const content = (
    <>
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-xl ${styles.iconWrap} ${styles.iconColor}`}
      >
        <ActionIcon name={icon} className="h-7 w-7" />
      </div>
      <span className="text-sm font-bold leading-snug text-ink">{label}</span>
    </>
  );

  if (disabled) {
    return (
      <div className={className} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={className}>
      {content}
    </Link>
  );
}
