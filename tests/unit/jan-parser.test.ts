import { describe, expect, it } from "vitest";
import { parseOpenFoodFactsResponse } from "@/lib/jan/parser";

describe("parseOpenFoodFactsResponse", () => {
  it("prefers Japanese product name and ingredients", () => {
    const result = parseOpenFoodFactsResponse("4901234567890", {
      status: 1,
      product: {
        product_name: "Onigiri",
        product_name_ja: "焼きおにぎり",
        ingredients_text: "rice, salt",
        ingredients_text_ja: "米、食塩",
      },
    });

    expect(result).toEqual({
      found: true,
      jan: "4901234567890",
      name: "焼きおにぎり",
      ingredientsRaw: "米、食塩",
      source: "open_food_facts",
    });
  });

  it("falls back to English fields when Japanese is missing", () => {
    const result = parseOpenFoodFactsResponse("4901234567890", {
      status: 1,
      product: {
        product_name: "Green Tea",
        ingredients_text: "water, tea leaves",
      },
    });

    expect(result).toEqual({
      found: true,
      jan: "4901234567890",
      name: "Green Tea",
      ingredientsRaw: "water, tea leaves",
      source: "open_food_facts",
    });
  });

  it("returns not_found when status is not 1", () => {
    const result = parseOpenFoodFactsResponse("4999999999999", {
      status: 0,
      status_verbose: "product not found",
    });

    expect(result).toEqual({ found: false, reason: "not_found" });
  });

  it("returns not_found when product name is missing", () => {
    const result = parseOpenFoodFactsResponse("4901234567890", {
      status: 1,
      product: {
        ingredients_text_ja: "米、食塩",
      },
    });

    expect(result).toEqual({ found: false, reason: "not_found" });
  });

  it("allows missing ingredients and keeps name only", () => {
    const result = parseOpenFoodFactsResponse("4901234567890", {
      status: 1,
      product: {
        product_name_ja: "お茶",
      },
    });

    expect(result).toEqual({
      found: true,
      jan: "4901234567890",
      name: "お茶",
      ingredientsRaw: null,
      source: "open_food_facts",
    });
  });
});
