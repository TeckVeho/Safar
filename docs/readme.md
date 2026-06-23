# Docs

## 1. Overview

> **Team onboarding:** [team-guide.md](./team-guide.md) — tổng hợp chức năng, công nghệ, cấu trúc code và trạng thái triển khai (tiếng Việt).

このディレクトリは Safar（ドライバー業務特化版：業務中の摩擦解消 — 食・荷物・言葉）の開発ドキュメントを管理する。
社内 AIDD 開発標準（[aidd-development-template](https://github.com/TeckVeho/aidd-development-template)）に準拠し、要件・仕様・アーキテクチャをリポジトリ内の Markdown で一元管理する。

目的:

- システム構成・要件・仕様をリポジトリで管理する
- 実装上の判断・前提を Markdown として記録する
- AI・開発者・レビュアーが同じ情報を参照できる状態にする
- OpenSpec・Issue・実装コードの対応を明確にする

OpenSpec の書き方の例は **[`openspec/changes/0001-halal-scan/`](../openspec/changes/0001-halal-scan/)** を参照（`proposal.md` → `design.md` → `tasks.md` → `specs/` の順で読む）。

基準資料:

- `Safar_機能概要書.docx`（v2.0 / 2026-06-10）
- `Safar_要件定義書.md`（本ドキュメント群へ分解済みの元資料）
- `safar-lp-driver.html`（UX/コピーの参照）

---

## 2. Policy

AIDD 開発標準の共通原則を **Policy** と呼ぶ。個別ドキュメント内の運用・更新ルールは **Rules** として扱う。

### Markdown First

設計・仕様・議論はできる限りリポジトリ内の Markdown として残す。Google Docs や口頭のみで管理せず、AI と人間の双方が参照できる状態を優先する。

### Docs as Development Context

`docs/` は単なる説明資料ではなく、実装・レビュー・AI 支援開発のコンテキストとして使う。

### Architecture Is Flexible

技術スタックは固定しない。Safar はモバイルアプリ＋オフライン＋OCR/地図/翻訳という構成であり、テンプレートの GCP/React/MySQL サンプルはそのまま流用しない（[architecture.md](./architecture/architecture.md) 参照）。

### Testing Strategy Is Standardized

テスト戦略は [testing-strategy.md](./architecture/testing-strategy.md) に従う。標準は Standard Policy セクションで維持し、プロジェクト固有の補足は Project-specific Notes に追記する。

### OpenSpec Integration

Issue ごとの実装計画・変更提案・受入条件は OpenSpec で管理する。`docs/` は人間向けの設計・仕様、`openspec/` は振る舞い仕様と変更管理を担う。

---

## 3. Customization Guide

| 区分 | 対象 |
|---|---|
| 差し替え推奨 | `architecture/architecture.md`, `architecture/infrastructure.md`, `requirements/`, `specifications/` |
| 調整可 | `architecture/directory-structure.md`, `specifications/` 配下のファイル分割 |
| 意図明示で変更可 | `architecture/development-flow.md`・`testing-strategy.md` の Project-specific Notes セクションのみ |
| 原則変更しない | `development-flow.md`・`testing-strategy.md` の Standard Policy セクション、本書 §2 Policy |

Standard Policy から逸脱する場合は、Issue / OpenSpec / PR に **差分・理由・リスク・代替/将来の解消計画** を記録する。

---

## 4. Directory Structure

```txt
docs/
├── readme.md
├── architecture/
│   ├── architecture.md          # 差し替え推奨
│   ├── development-flow.md       # Standard Policy 固定 / §10 のみ追記可
│   ├── testing-strategy.md       # Standard Policy 固定 / §15 のみ追記可
│   ├── directory-structure.md    # 調整可
│   └── infrastructure.md         # 差し替え推奨
├── requirements/                 # 差し替え推奨（本プロジェクトで新規作成）
└── specifications/               # 差し替え推奨（本プロジェクトで新規作成）
```

詳細なファイル一覧と責務は [directory-structure.md](./architecture/directory-structure.md) を参照。
