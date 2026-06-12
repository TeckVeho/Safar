import type { Verdict } from "@/lib/halal/types";

type VerdictCardProps = {
  verdict: Verdict;
  productName?: string;
  reasons: Array<{ label: string }>;
  labels: {
    verdictOk: string;
    verdictAvoid: string;
    verdictMaybe: string;
    userMustConfirm: string;
    reasons: string;
  };
  userMustConfirm: boolean;
};

const verdictStyles: Record<
  Verdict,
  { badge: string; container: string; label: string }
> = {
  ok: {
    badge: "bg-[var(--verdict-ok-bg)] text-[var(--verdict-ok)]",
    container: "border-[var(--verdict-ok)]/20 bg-[var(--verdict-ok-bg)]/40",
    label: "verdictOk",
  },
  avoid: {
    badge: "bg-[var(--verdict-avoid-bg)] text-[var(--verdict-avoid)]",
    container: "border-[var(--verdict-avoid)]/20 bg-[var(--verdict-avoid-bg)]/40",
    label: "verdictAvoid",
  },
  maybe: {
    badge: "bg-[var(--verdict-maybe-bg)] text-[var(--verdict-maybe)]",
    container: "border-[var(--verdict-maybe)]/20 bg-[var(--verdict-maybe-bg)]/40",
    label: "verdictMaybe",
  },
};

export function VerdictCard({
  verdict,
  productName,
  reasons,
  labels,
  userMustConfirm,
}: VerdictCardProps) {
  const styles = verdictStyles[verdict];
  const verdictLabel =
    verdict === "ok"
      ? labels.verdictOk
      : verdict === "avoid"
        ? labels.verdictAvoid
        : labels.verdictMaybe;

  return (
    <section className={`rounded-2xl border p-4 ${styles.container}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {productName ? (
            <p className="text-base font-bold text-ink">{productName}</p>
          ) : null}
          <span
            className={`mt-2 inline-flex rounded-full px-3 py-1 text-xs font-bold ${styles.badge}`}
          >
            {verdictLabel}
          </span>
        </div>
      </div>

      {reasons.length > 0 ? (
        <div className="mt-4">
          <p className="text-xs font-bold uppercase tracking-wide text-sage">
            {labels.reasons}
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {reasons.map((reason) => (
              <li key={reason.label}>• {reason.label}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {userMustConfirm ? (
        <p className="mt-4 text-sm font-medium text-sage">{labels.userMustConfirm}</p>
      ) : null}
    </section>
  );
}
