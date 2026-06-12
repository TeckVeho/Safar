import type { NgMatch } from "@/lib/halal/types";

export type CargoItemResult = {
  line: string;
  jan?: string;
  productName?: string;
  hasPork: boolean;
  reasons: NgMatch[];
};

export type CargoCheckResult = {
  items: CargoItemResult[];
  hasAnyPork: boolean;
};
