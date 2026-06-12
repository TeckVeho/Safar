import { describe, expect, it } from "vitest";
import { judgeHalal } from "@/lib/halal/judge";

const dictionary = [
  { category: "pork" as const, term: "豚肉", note: "豚由来" },
  { category: "pork" as const, term: "ポーク", note: "豚由来" },
  { category: "alcohol" as const, term: "みりん", note: "アルコール" },
  { category: "alcohol" as const, term: "料理酒", note: "アルコール" },
  { category: "gelatin" as const, term: "豚ゼラチン", note: "豚由来" },
  { category: "gelatin" as const, term: "動物性ゼラチン", note: "動物由来" },
];

describe("judgeHalal", () => {
  it("returns ok for safe product by JAN", () => {
    const result = judgeHalal(
      { jan: "4901111111111" },
      dictionary,
      {
        jan: "4901111111111",
        name: "焼きおにぎり（昆布）",
        ingredientsRaw: "米、昆布、食塩",
      },
    );

    expect(result.verdict).toBe("ok");
    expect(result.userMustConfirm).toBe(false);
  });

  it("returns avoid when pork and mirin are detected", () => {
    const result = judgeHalal(
      { jan: "4902222222222" },
      dictionary,
      {
        jan: "4902222222222",
        name: "ポークカレーまん",
        ingredientsRaw: "小麦粉、豚肉、みりん",
      },
    );

    expect(result.verdict).toBe("avoid");
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("returns maybe for unknown gelatin origin", () => {
    const result = judgeHalal(
      { jan: "4903333333333" },
      dictionary,
      {
        jan: "4903333333333",
        name: "グミ（果汁）",
        ingredientsRaw: "砂糖、果汁、ゼラチン",
      },
    );

    expect(result.verdict).toBe("maybe");
    expect(result.userMustConfirm).toBe(true);
  });

  it("returns maybe for unknown JAN", () => {
    const result = judgeHalal({ jan: "4999999999999" }, dictionary, null);
    expect(result.verdict).toBe("maybe");
    expect(result.source).toBe("none");
  });

  it("returns maybe when OCR input is empty", () => {
    const result = judgeHalal({}, dictionary, null);
    expect(result.verdict).toBe("maybe");
  });

  it("detects alcohol from OCR ingredients text", () => {
    const result = judgeHalal(
      { ingredientsText: "小麦粉、砂糖、料理酒、食塩" },
      dictionary,
      null,
    );

    expect(result.verdict).toBe("avoid");
  });
});
