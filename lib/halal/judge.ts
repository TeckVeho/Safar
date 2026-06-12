import { findNgMatches, hasUnknownGelatin } from "./ng-dictionary";
import type {
  HalalJudgeInput,
  HalalJudgeResult,
  NgIngredientRecord,
  ProductRecord,
  Verdict,
} from "./types";

function buildResult(params: {
  verdict: Verdict;
  reasons: HalalJudgeResult["reasons"];
  source: HalalJudgeResult["source"];
  productName?: string;
}): HalalJudgeResult {
  const userMustConfirm = params.verdict === "maybe";

  return {
    verdict: params.verdict,
    productName: params.productName,
    reasons: params.reasons,
    userMustConfirm,
    source: params.source,
  };
}

function judgeText(
  text: string,
  dictionary: NgIngredientRecord[],
  source: HalalJudgeResult["source"],
  productName?: string,
): HalalJudgeResult {
  if (hasUnknownGelatin(text)) {
    return buildResult({
      verdict: "maybe",
      reasons: [
        {
          category: "gelatin",
          term: "ゼラチン",
          note: "由来が不明",
        },
      ],
      source,
      productName,
    });
  }

  const reasons = findNgMatches(text, dictionary);

  if (reasons.length > 0) {
    return buildResult({
      verdict: "avoid",
      reasons,
      source,
      productName,
    });
  }

  if (text.trim().length === 0) {
    return buildResult({
      verdict: "maybe",
      reasons: [
        {
          category: "other",
          term: "情報不足",
          note: "判定に必要な情報がありません",
        },
      ],
      source: "none",
      productName,
    });
  }

  return buildResult({
    verdict: "ok",
    reasons: [],
    source,
    productName,
  });
}

export function judgeHalal(
  input: HalalJudgeInput,
  dictionary: NgIngredientRecord[],
  product?: ProductRecord | null,
): HalalJudgeResult {
  if (product) {
    const text = [product.name, product.ingredientsRaw ?? ""].join("\n");
    return judgeText(text, dictionary, "jan", product.name);
  }

  if (input.productIngredients || input.productName) {
    const text = [input.productName ?? "", input.productIngredients ?? ""].join("\n");
    return judgeText(text, dictionary, "jan", input.productName);
  }

  if (input.ingredientsText?.trim()) {
    return judgeText(input.ingredientsText, dictionary, "ocr");
  }

  if (input.jan?.trim()) {
    return buildResult({
      verdict: "maybe",
      reasons: [
        {
          category: "other",
          term: "未登録商品",
          note: "JANが商品DBにありません",
        },
      ],
      source: "none",
    });
  }

  return buildResult({
    verdict: "maybe",
    reasons: [
      {
        category: "other",
        term: "情報不足",
        note: "JANまたは成分が必要です",
      },
    ],
    source: "none",
  });
}
