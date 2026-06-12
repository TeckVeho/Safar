import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchProductFromOpenFoodFacts } from "@/lib/jan/adapters/open-food-facts";

describe("fetchProductFromOpenFoodFacts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("returns invalid_jan for malformed codes", async () => {
    const result = await fetchProductFromOpenFoodFacts("12345");
    expect(result).toEqual({ found: false, reason: "invalid_jan" });
  });

  it("maps a successful API response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({
          status: 1,
          product: {
            product_name_ja: "焼きおにぎり",
            ingredients_text_ja: "米、食塩",
          },
        }),
      }),
    );

    const result = await fetchProductFromOpenFoodFacts("4901234567890");

    expect(result).toEqual({
      found: true,
      jan: "4901234567890",
      name: "焼きおにぎり",
      ingredientsRaw: "米、食塩",
      source: "open_food_facts",
    });
  });

  it("returns rate_limited on HTTP 429", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      }),
    );

    const result = await fetchProductFromOpenFoodFacts("4901234567890");
    expect(result).toEqual({ found: false, reason: "rate_limited" });
  });

  it("returns timeout when the request is aborted", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(Object.assign(new Error("aborted"), { name: "AbortError" })),
    );

    const result = await fetchProductFromOpenFoodFacts("4901234567890");
    expect(result).toEqual({ found: false, reason: "timeout" });
  });
});
