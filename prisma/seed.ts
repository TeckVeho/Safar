import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const ngIngredients = [
  { category: "pork" as const, term: "豚肉", note: "豚由来" },
  { category: "pork" as const, term: "ポーク", note: "豚由来" },
  { category: "pork" as const, term: "豚エキス", note: "豚由来" },
  { category: "pork" as const, term: "ラード", note: "豚油脂" },
  { category: "alcohol" as const, term: "みりん", note: "アルコール" },
  { category: "alcohol" as const, term: "料理酒", note: "アルコール" },
  { category: "alcohol" as const, term: "日本酒", note: "アルコール" },
  { category: "alcohol" as const, term: "酒", note: "アルコール" },
  { category: "gelatin" as const, term: "豚ゼラチン", note: "豚由来" },
  { category: "gelatin" as const, term: "動物性ゼラチン", note: "動物由来" },
];

const products = [
  {
    jan: "4901111111111",
    name: "焼きおにぎり（昆布）",
    ingredientsRaw: "米、昆布、食塩、海藻酸ナトリウム",
    verdict: "ok" as const,
  },
  {
    jan: "4902222222222",
    name: "ポークカレーまん",
    ingredientsRaw: "小麦粉、豚肉、カレー粉、みりん",
    verdict: "avoid" as const,
  },
  {
    jan: "4903333333333",
    name: "グミ（果汁）",
    ingredientsRaw: "砂糖、果汁、ゼラチン、酸味料",
    verdict: "maybe" as const,
  },
];

const phrases = [
  {
    category: "tenko" as const,
    ja: "アルコールチェックは問題ありません。",
    ru: "Проверка на алкоголь пройдена без проблем.",
  },
  {
    category: "tenko" as const,
    ja: "本日の体調は良好です。",
    ru: "Сегодня самочувствие хорошее.",
  },
  {
    category: "denpyo" as const,
    ja: "この伝票の荷物を確認します。",
    ru: "Я проверю груз по этой накладной.",
  },
  {
    category: "denpyo" as const,
    ja: "伝票番号を確認させてください。",
    ru: "Пожалуйста, позвольте проверить номер накладной.",
  },
  {
    category: "niyaku" as const,
    ja: "この荷物はどこに置きますか？",
    ru: "Куда поставить этот груз?",
  },
  {
    category: "niyaku" as const,
    ja: "積込が完了しました。",
    ru: "Погрузка завершена.",
  },
  {
    category: "ninushi" as const,
    ja: "配達に伺いました。サインをお願いします。",
    ru: "Я привёз доставку. Пожалуйста, распишитесь.",
  },
  {
    category: "ninushi" as const,
    ja: "少々お待ちください。",
    ru: "Пожалуйста, подождите немного.",
  },
  {
    category: "jiko" as const,
    ja: "事故が発生しました。すぐに連絡します。",
    ru: "Произошла авария. Я немедленно сообщу.",
  },
  {
    category: "jiko" as const,
    ja: "怪我人はいません。",
    ru: "Пострадавших нет.",
  },
];

async function main() {
  await prisma.ngIngredient.deleteMany();
  await prisma.product.deleteMany();
  await prisma.phrase.deleteMany();

  await prisma.ngIngredient.createMany({ data: ngIngredients });
  await prisma.product.createMany({ data: products });
  await prisma.phrase.createMany({ data: phrases });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
