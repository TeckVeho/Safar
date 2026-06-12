import Link from "next/link";
import { ChevronLeftIcon } from "@/components/icons";

type BackButtonProps = {
  href?: string;
  label: string;
};

export function BackButton({ href = "/", label }: BackButtonProps) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex items-center gap-1 rounded-full border border-[var(--line)] bg-card px-3 py-2 text-sm font-bold text-teal-800 transition hover:border-saffron hover:bg-[#fff7ea]"
    >
      <ChevronLeftIcon className="h-4 w-4" />
      {label}
    </Link>
  );
}
