import { prisma } from "@/lib/db/prisma";
import type { ProductRecord } from "@/lib/halal/types";
import { fetchProductFromOpenFoodFacts } from "./adapters/open-food-facts";
import type { JanFetchResult } from "./types";

export async function fetchJanData(jan: string): Promise<JanFetchResult> {
  return fetchProductFromOpenFoodFacts(jan);
}

export async function resolveProductByJan(jan: string): Promise<ProductRecord | null> {
  const existing = await prisma.product.findUnique({
    where: { jan },
    select: { jan: true, name: true, ingredientsRaw: true },
  });

  if (existing) {
    return existing;
  }

  const fetched = await fetchJanData(jan);
  if (!fetched.found) {
    return null;
  }

  return prisma.product.upsert({
    where: { jan },
    create: {
      jan: fetched.jan,
      name: fetched.name,
      ingredientsRaw: fetched.ingredientsRaw,
    },
    update: {
      name: fetched.name,
      ingredientsRaw: fetched.ingredientsRaw,
    },
    select: { jan: true, name: true, ingredientsRaw: true },
  });
}
