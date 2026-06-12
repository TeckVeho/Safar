import { describe, expect, it } from "vitest";
import { checkCargoJan, checkCargoText } from "@/lib/cargo/judge";
import { parseCargoLines } from "@/lib/cargo/parse-items";

const dictionary = [
  { category: "pork" as const, term: "豚肉", note: "豚由来" },
  { category: "pork" as const, term: "ポーク", note: "豚由来" },
  { category: "alcohol" as const, term: "みりん", note: "アルコール" },
];

const productsByJan = new Map([
  [
    "4901111111111",
    {
      jan: "4901111111111",
      name: "焼きおにぎり（昆布）",
      ingredientsRaw: "米、昆布、食塩",
    },
  ],
  [
    "4902222222222",
    {
      jan: "4902222222222",
      name: "ポークカレーまん",
      ingredientsRaw: "小麦粉、豚肉、みりん",
    },
  ],
]);

describe("parseCargoLines", () => {
  it("extracts JAN codes from lines", () => {
    const lines = parseCargoLines("4901111111111 焼きおにぎり\nポークカレー");
    expect(lines).toHaveLength(2);
    expect(lines[0]?.jan).toBe("4901111111111");
    expect(lines[1]?.jan).toBeUndefined();
  });
});

describe("checkCargoJan", () => {
  it("detects pork in registered product", () => {
    const result = checkCargoJan(
      "4902222222222",
      dictionary,
      productsByJan.get("4902222222222"),
    );

    expect(result.hasPork).toBe(true);
    expect(result.reasons.length).toBeGreaterThan(0);
  });

  it("returns no pork for safe product", () => {
    const result = checkCargoJan(
      "4901111111111",
      dictionary,
      productsByJan.get("4901111111111"),
    );

    expect(result.hasPork).toBe(false);
  });
});

describe("checkCargoText", () => {
  it("flags pork items in batch text", () => {
    const text = "4901111111111 焼きおにぎり\n4902222222222 ポークカレーまん";
    const result = checkCargoText(text, dictionary, productsByJan);

    expect(result.hasAnyPork).toBe(true);
    expect(result.items.filter((item) => item.hasPork)).toHaveLength(1);
  });

  it("detects pork keyword without JAN lookup", () => {
    const result = checkCargoText("豚肉加工品 10個", dictionary, productsByJan);
    expect(result.hasAnyPork).toBe(true);
  });

  it("ignores alcohol-only ingredients for cargo check", () => {
    const result = checkCargoText("みりん入り調味料", dictionary, productsByJan);
    expect(result.hasAnyPork).toBe(false);
  });
});
