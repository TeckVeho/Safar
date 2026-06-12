import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  try {
    const phrases = await prisma.phrase.findMany({
      orderBy: [{ category: "asc" }, { id: "asc" }],
      select: {
        id: true,
        category: true,
        ja: true,
        ru: true,
      },
    });

    return NextResponse.json({ phrases });
  } catch (error) {
    console.error("phrases fetch error", error);
    return NextResponse.json({ error: "failed to fetch phrases" }, { status: 500 });
  }
}
