import { NextResponse } from "next/server";
import { checkCargoJan, checkCargoText } from "@/lib/cargo/judge";
import { formatReason } from "@/lib/halal/ng-dictionary";
import { prisma } from "@/lib/db/prisma";

type CargoCheckRequestBody = {
  jan?: string;
  itemsText?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CargoCheckRequestBody;
    const jan = body.jan?.trim();
    const itemsText = body.itemsText?.trim();

    if (!jan && !itemsText) {
      return NextResponse.json(
        { error: "jan or itemsText is required" },
        { status: 400 },
      );
    }

    const dictionary = await prisma.ngIngredient.findMany({
      select: { category: true, term: true, note: true },
    });

    const ngDictionary = dictionary.map((entry) => ({
      category: entry.category as "pork" | "alcohol" | "gelatin" | "other",
      term: entry.term,
      note: entry.note,
    }));

    if (jan) {
      const product = await prisma.product.findUnique({
        where: { jan },
        select: { jan: true, name: true, ingredientsRaw: true },
      });

      const item = checkCargoJan(jan, ngDictionary, product);

      return NextResponse.json({
        items: [
          {
            ...item,
            reasons: item.reasons.map((reason) => ({
              ...reason,
              label: formatReason(reason),
            })),
          },
        ],
        hasAnyPork: item.hasPork,
      });
    }

    const janCodes = [...itemsText!.matchAll(/\b(\d{13})\b/g)].map((match) => match[1]);
    const uniqueJans = [...new Set(janCodes)];

    const products = uniqueJans.length
      ? await prisma.product.findMany({
          where: { jan: { in: uniqueJans } },
          select: { jan: true, name: true, ingredientsRaw: true },
        })
      : [];

    const productsByJan = new Map(products.map((product) => [product.jan, product]));
    const result = checkCargoText(itemsText!, ngDictionary, productsByJan);

    return NextResponse.json({
      items: result.items.map((item) => ({
        ...item,
        reasons: item.reasons.map((reason) => ({
          ...reason,
          label: formatReason(reason),
        })),
      })),
      hasAnyPork: result.hasAnyPork,
    });
  } catch (error) {
    console.error("cargo check error", error);
    return NextResponse.json({ error: "failed to check cargo" }, { status: 500 });
  }
}
