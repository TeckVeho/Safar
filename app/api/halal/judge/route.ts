import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { judgeHalal } from "@/lib/halal/judge";
import { formatReason } from "@/lib/halal/ng-dictionary";
import { resolveProductByJan } from "@/lib/jan/lookup";

type JudgeRequestBody = {
  jan?: string;
  ingredientsText?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as JudgeRequestBody;
    const jan = body.jan?.trim();
    const ingredientsText = body.ingredientsText?.trim();

    if (!jan && !ingredientsText) {
      return NextResponse.json(
        { error: "jan or ingredientsText is required" },
        { status: 400 },
      );
    }

    const [dictionary, product] = await Promise.all([
      prisma.ngIngredient.findMany({
        select: { category: true, term: true, note: true },
      }),
      jan ? resolveProductByJan(jan) : Promise.resolve(null),
    ]);

    const result = judgeHalal(
      { jan, ingredientsText },
      dictionary.map((entry) => ({
        category: entry.category as "pork" | "alcohol" | "gelatin" | "other",
        term: entry.term,
        note: entry.note,
      })),
      product,
    );

    return NextResponse.json({
      verdict: result.verdict,
      productName: result.productName,
      reasons: result.reasons.map((reason) => ({
        ...reason,
        label: formatReason(reason),
      })),
      userMustConfirm: result.userMustConfirm,
      source: result.source,
    });
  } catch (error) {
    console.error("halal judge error", error);
    return NextResponse.json({ error: "failed to judge halal status" }, { status: 500 });
  }
}
