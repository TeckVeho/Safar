export type Verdict = "ok" | "avoid" | "maybe";

export type NgCategory = "pork" | "alcohol" | "gelatin" | "other";

export type NgMatch = {
  category: NgCategory;
  term: string;
  note?: string | null;
};

export type HalalJudgeInput = {
  jan?: string;
  ingredientsText?: string;
  productName?: string;
  productIngredients?: string | null;
};

export type HalalJudgeResult = {
  verdict: Verdict;
  productName?: string;
  reasons: NgMatch[];
  userMustConfirm: boolean;
  source: "jan" | "ocr" | "none";
};

export type NgIngredientRecord = {
  category: NgCategory;
  term: string;
  note?: string | null;
};

export type ProductRecord = {
  jan: string;
  name: string;
  ingredientsRaw?: string | null;
};
