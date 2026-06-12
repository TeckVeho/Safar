import { describe, expect, it } from "vitest";
import { createCargoHistoryEntry, createHalalHistoryEntry } from "@/lib/scan-history/create-entry";
import {
  MAX_SCAN_HISTORY,
  parseScanHistory,
  prependScanHistoryEntry,
} from "@/lib/scan-history/store";

describe("scan history store", () => {
  it("parses valid history entries", () => {
    const raw = JSON.stringify([
      {
        id: "1",
        type: "halal",
        scannedAt: "2026-06-12T10:00:00.000Z",
        title: "焼きおにぎり",
        verdict: "ok",
        href: "/halal-scanner",
      },
    ]);

    expect(parseScanHistory(raw)).toHaveLength(1);
  });

  it("returns empty array for invalid json", () => {
    expect(parseScanHistory("{invalid")).toEqual([]);
  });

  it("prepends entries and keeps max length", () => {
    const existing = Array.from({ length: MAX_SCAN_HISTORY }, (_, index) => ({
      id: String(index),
      type: "halal" as const,
      scannedAt: "2026-06-12T10:00:00.000Z",
      title: `item-${index}`,
      verdict: "ok" as const,
      href: "/halal-scanner",
    }));

    const next = prependScanHistoryEntry(existing, {
      type: "cargo",
      title: "new",
      hasAnyPork: false,
      href: "/cargo-check",
    });

    expect(next).toHaveLength(MAX_SCAN_HISTORY);
    expect(next[0]?.title).toBe("new");
  });
});

describe("create history entries", () => {
  it("creates halal entry from product name", () => {
    const entry = createHalalHistoryEntry({
      jan: "4901111111111",
      productName: "焼きおにぎり（昆布）",
      verdict: "ok",
    });

    expect(entry).toMatchObject({
      type: "halal",
      title: "焼きおにぎり（昆布）",
      verdict: "ok",
      jan: "4901111111111",
    });
  });

  it("creates cargo entry for item list", () => {
    const entry = createCargoHistoryEntry({
      itemsText: "4901111111111 焼きおにぎり\n4902222222222 ポークカレー",
      items: [
        { line: "4901111111111 焼きおにぎり", productName: "焼きおにぎり" },
        { line: "4902222222222 ポークカレー", productName: "ポークカレー" },
      ],
      hasAnyPork: true,
      itemListLabel: (count) => `品目リスト（${count}件）`,
      ingredientsFallbackLabel: "品目チェック",
    });

    expect(entry).toMatchObject({
      type: "cargo",
      title: "品目リスト（2件）",
      hasAnyPork: true,
    });
  });
});
