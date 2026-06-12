import { parseOpenFoodFactsResponse } from "../parser";
import type { JanFetchResult, OpenFoodFactsResponse } from "../types";

const OFF_API_BASE = "https://world.openfoodfacts.org/api/v2/product";
const DEFAULT_TIMEOUT_MS = 3_000;
const USER_AGENT = "Safar/0.1 (halal-scanner-poc; contact@example.com)";

function isValidJan(jan: string): boolean {
  return /^\d{13}$/.test(jan);
}

export async function fetchProductFromOpenFoodFacts(
  jan: string,
  options?: { timeoutMs?: number },
): Promise<JanFetchResult> {
  if (!isValidJan(jan)) {
    return { found: false, reason: "invalid_jan" };
  }

  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${OFF_API_BASE}/${jan}.json`, {
      headers: {
        Accept: "application/json",
        "User-Agent": USER_AGENT,
      },
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    if (response.status === 429) {
      return { found: false, reason: "rate_limited" };
    }

    if (!response.ok) {
      return { found: false, reason: "api_error" };
    }

    const payload = (await response.json()) as OpenFoodFactsResponse;
    return parseOpenFoodFactsResponse(jan, payload);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return { found: false, reason: "timeout" };
    }

    return { found: false, reason: "api_error" };
  } finally {
    clearTimeout(timeoutId);
  }
}
