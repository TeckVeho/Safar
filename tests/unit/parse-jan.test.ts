import { describe, expect, it } from "vitest";
import { parseJanFromBarcode } from "@/lib/barcode/parse-jan";

describe("parseJanFromBarcode", () => {
  it("returns 13-digit EAN-13 as-is", () => {
    expect(parseJanFromBarcode("4901111111111")).toBe("4901111111111");
  });

  it("converts 12-digit UPC-A to EAN-13", () => {
    expect(parseJanFromBarcode("901111111111")).toBe("0901111111111");
  });

  it("extracts embedded 13-digit JAN from text", () => {
    expect(parseJanFromBarcode("JAN:4902222222222")).toBe("4902222222222");
  });

  it("returns null for unsupported formats", () => {
    expect(parseJanFromBarcode("12345")).toBeNull();
    expect(parseJanFromBarcode("")).toBeNull();
  });
});
