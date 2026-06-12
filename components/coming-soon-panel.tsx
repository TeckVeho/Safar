import { ActionIcon, type ActionIconName } from "@/components/icons";
import { PageHeader } from "@/components/page-header";

type ComingSoonPanelProps = {
  pageTitle: string;
  comingSoonLabel: string;
  description: string;
  backLabel: string;
  icon: ActionIconName;
};

export function ComingSoonPanel({
  pageTitle,
  comingSoonLabel,
  description,
  backLabel,
  icon,
}: ComingSoonPanelProps) {
  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title={pageTitle}
        description={description}
        backLabel={backLabel}
        icon={icon}
      />

      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-card px-6 py-10 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sand-2 text-teal-800">
          <ActionIcon name={icon} className="h-9 w-9" />
        </div>
        <p className="mt-4 text-lg font-bold text-ink">{comingSoonLabel}</p>
        <p className="mt-2 text-sm text-sage">{description}</p>
      </div>
    </div>
  );
}
