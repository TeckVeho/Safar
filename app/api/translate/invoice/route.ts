import { NextResponse } from "next/server";
import { translateInvoiceText } from "@/lib/translate/invoice";

type TranslateRequestBody = {
  text?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TranslateRequestBody;
    const text = body.text?.trim();

    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }

    const result = translateInvoiceText(text);
    return NextResponse.json(result);
  } catch (error) {
    console.error("invoice translate error", error);
    return NextResponse.json({ error: "failed to translate invoice" }, { status: 500 });
  }
}
