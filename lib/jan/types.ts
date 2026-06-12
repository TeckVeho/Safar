export type JanSource = "open_food_facts" | "manual";

export type JanFetchResult =
  | {
      found: true;
      jan: string;
      name: string;
      ingredientsRaw: string | null;
      source: JanSource;
    }
  | {
      found: false;
      reason: "not_found" | "invalid_jan" | "api_error" | "rate_limited" | "timeout";
    };

export type OpenFoodFactsProduct = {
  code?: string;
  product_name?: string;
  product_name_ja?: string;
  generic_name?: string;
  generic_name_ja?: string;
  ingredients_text?: string;
  ingredients_text_ja?: string;
};

export type OpenFoodFactsResponse = {
  status?: number;
  status_verbose?: string;
  code?: string;
  product?: OpenFoodFactsProduct;
};
