import { describe, expect, it } from "vitest";
import { translateInvoiceLine, translateInvoiceText } from "@/lib/translate/invoice";

describe("translateInvoiceText", () => {
  it("translates known logistics terms", () => {
    const result = translateInvoiceLine("伝票番号 12345");
    expect(result).toContain("Накладная");
  });

  it("translates multiple lines", () => {
    const result = translateInvoiceText("伝票\n商品名: 豚肉\n数量 10個");
    expect(result.lines).toHaveLength(3);
    expect(result.fullText).toContain("Свинина");
    expect(result.fullText).toContain("Количество");
  });
});
