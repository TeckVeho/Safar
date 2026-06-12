import type { JanFetchResult, OpenFoodFactsResponse } from "./types";

function pickLocalizedText(
  localized: string | undefined,
  fallback: string | undefined,
): string | null {
  const value = localized?.trim() || fallback?.trim();
  return value ? value : null;
}

export function parseOpenFoodFactsResponse(
  jan: string,
  payload: OpenFoodFactsResponse,
): JanFetchResult {
  if (payload.status !== 1 || !payload.product) {
    return { found: false, reason: "not_found" };
  }

  const product = payload.product;
  const name =
    pickLocalizedText(product.product_name_ja, product.product_name) ??
    pickLocalizedText(product.generic_name_ja, product.generic_name);

  if (!name) {
    return { found: false, reason: "not_found" };
  }

  const ingredientsRaw = pickLocalizedText(
    product.ingredients_text_ja,
    product.ingredients_text,
  );

  return {
    found: true,
    jan,
    name,
    ingredientsRaw,
    source: "open_food_facts",
  };
}
