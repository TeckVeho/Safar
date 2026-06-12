# Safar

トラックで日本を走る、中央アジアのムスリムドライバーの相棒。**道・食・言葉** に集中する（ドライバー業務特化版）。

本リポジトリは社内 **AIDD（AI-Driven Development）** 標準（[aidd-development-template](https://github.com/TeckVeho/aidd-development-template)）に準拠して構成している。

---

## 最初に読むドキュメント

1. [docs/readme.md](./docs/readme.md) — AIDD 共通方針・ドキュメントの読み方
2. [docs/architecture/directory-structure.md](./docs/architecture/directory-structure.md) — リポジトリ構成と責務
3. [docs/architecture/development-flow.md](./docs/architecture/development-flow.md) — Issue → OpenSpec → 実装 → PR
4. OpenSpec サンプル — [openspec/changes/0001-halal-scan/](./openspec/changes/0001-halal-scan/)（`proposal.md` から）

---

## ディレクトリ

```txt
Safar/
├── app/                        # Next.js App Router（画面・API）
├── components/                 # 共有 UI
├── lib/                        # ビジネスロジック
├── prisma/                     # MySQL スキーマ・seed
├── docs/                       # 設計・要件・仕様
├── openspec/                   # 振る舞い仕様・Issue 単位の変更提案
├── Safar_機能概要書.docx        # 基準資料（コンセプト v2.0）
├── Safar_要件定義書.md          # 基準資料（docs/ へ分解済み）
└── safar-lp-driver.html        # ドライバー向け LP
```

実装のセットアップ手順は [SETUP.md](./SETUP.md) を参照。

詳細は [docs/architecture/directory-structure.md](./docs/architecture/directory-structure.md) を参照。

---

## スコープ

「走る一日」＝走行・業務中の摩擦解消（道・食・言葉・礼拝・基盤＋B2B〔P2〕）に集中する。ビザ・生活立ち上げ等は意図的に保留（[docs/requirements/functional-requirements.md](./docs/requirements/functional-requirements.md) §3）。

> 技術スタック: **Next.js + MySQL + GCP (Cloud Run)**。詳細は [SETUP.md](./SETUP.md) と `docs/architecture/` を参照。
