import { findNgMatches } from "@/lib/halal/ng-dictionary";
import type { NgIngredientRecord, ProductRecord } from "@/lib/halal/types";
import type { CargoCheckResult, CargoItemResult } from "./types";
import { parseCargoLines } from "./parse-items";

function judgeLineForPork(
  text: string,
  porkDictionary: NgIngredientRecord[],
  product?: ProductRecord | null,
): Pick<CargoItemResult, "hasPork" | "reasons" | "productName"> {
  const productName = product?.name;
  const combined = [productName ?? "", product?.ingredientsRaw ?? "", text].join("\n");
  const reasons = findNgMatches(combined, porkDictionary);

  return {
    hasPork: reasons.length > 0,
    reasons,
    productName,
  };
}

export function checkCargoText(
  itemsText: string,
  dictionary: NgIngredientRecord[],
  productsByJan: Map<string, ProductRecord>,
): CargoCheckResult {
  const porkDictionary = dictionary.filter((entry) => entry.category === "pork");
  const lines = parseCargoLines(itemsText);

  const items: CargoItemResult[] = lines.map(({ line, jan }) => {
    const product = jan ? productsByJan.get(jan) : undefined;
    const result = judgeLineForPork(line, porkDictionary, product);

    return {
      line,
      jan,
      ...result,
    };
  });

  return {
    items,
    hasAnyPork: items.some((item) => item.hasPork),
  };
}

export function checkCargoJan(
  jan: string,
  dictionary: NgIngredientRecord[],
  product?: ProductRecord | null,
): CargoItemResult {
  const porkDictionary = dictionary.filter((entry) => entry.category === "pork");
  const result = judgeLineForPork(jan, porkDictionary, product);

  return {
    line: jan,
    jan,
    ...result,
  };
}
