import { BackButton } from "@/components/back-button";
import { ActionIcon, type ActionIconName } from "@/components/icons";

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  backLabel: string;
  backHref?: string;
  icon?: ActionIconName;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  backLabel,
  backHref = "/",
  icon,
}: PageHeaderProps) {
  return (
    <header className="mb-2">
      <BackButton href={backHref} label={backLabel} />

      <div className="flex items-start gap-4">
        {icon ? (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-900 to-teal-950 text-saffron shadow-md">
            <ActionIcon name={icon} className="h-8 w-8" />
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          {eyebrow ? (
            <p className="font-latin text-xs font-semibold uppercase tracking-[0.18em] text-saffron-deep">
              {eyebrow}
            </p>
          ) : null}
          <h1 className={`text-2xl ${eyebrow ? "mt-1" : ""}`}>{title}</h1>
          {description ? <p className="mt-2 text-sm text-sage">{description}</p> : null}
        </div>
      </div>
    </header>
  );
}
