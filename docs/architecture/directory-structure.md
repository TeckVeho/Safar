# Directory Structure

## 1. Purpose and Scope

本書はリポジトリ全体と `docs/` の責務分担を定義する。共通の AIDD 標準方針は [../readme.md](../readme.md) に従う。`file-list.md` は作らず、構成と責務は本書に集約する。

---

## 2. Root Structure

```txt
Safar/
├── .github/
│   ├── ISSUE_TEMPLATE/        # Issue フォーム（feature/bug/docs/investigation/AI-assisted）
│   └── pull_request_template.md
├── app/                       # モバイルアプリ実装（未実装・プレースホルダ）
├── services/                  # バックエンド/データサービス実装（未実装・プレースホルダ）
├── docs/                      # 設計・要件・仕様
├── openspec/                  # 振る舞い仕様と Issue 単位の変更提案
├── Safar_機能概要書.docx       # 基準資料（コンセプト v2.0）
├── Safar_要件定義書.md         # 基準資料（docs/ へ分解済み）
└── safar-lp-driver.html       # ドライバー向け LP（UX/コピー参照）
```

| ディレクトリ | 状態 | 責務 |
|---|---|---|
| `app/` | 空 | モバイルアプリ UI、ナビゲーション、オフラインキャッシュ、音声 I/O、端末センサー（GPS/カメラ） |
| `services/` | 空 | 商品/フレーズ等のデータ API、荷物チェック、OCR・翻訳・地図の外部連携、B2B 連携 |
| `docs/` | 整備中 | アーキテクチャ・要件・仕様 |
| `openspec/` | 整備中 | 振る舞い仕様・変更提案 |

> インフラ構成（クラウド/IaC）は未確定のため、テンプレートの `terraform/` は持ち込まず [infrastructure.md](./infrastructure.md) に TBD として記す。

---

## 3. docs Structure

```txt
docs/
├── readme.md
├── team-guide.md               # Team onboarding（機能・技術・構成・実装状況）
├── architecture/
│   ├── architecture.md
│   ├── development-flow.md
│   ├── testing-strategy.md
│   ├── directory-structure.md      # 本書
│   └── infrastructure.md
├── requirements/
│   ├── business-requirements.md     # BR
│   ├── functional-requirements.md   # FR
│   ├── nonfunctional-requirements.md# NFR
│   └── use-case.md                  # UC
└── specifications/
    ├── frontend/
    │   ├── screen-list.md           # 画面索引・遷移・要件マッピング
    │   ├── screens/                 # 画面別仕様
    │   └── components/              # 部品別仕様（Props/Events/Validation）
    └── backend/
        ├── data-services.md         # データサービス補足（業務ロジック・判定規則）
        ├── db-schema.md             # データストア定義
        └── external-api-spec.md     # 外部連携（OCR/翻訳/地図/音声）
```

### 3.1 用語

| 用語 | 意味 |
|---|---|
| 判定 | ハラル可否の3区分（OK / 避けて / 疑わしい） |
| 荷物チェック | 配送荷物の豚含有判定（伝票/JAN→商品DB照合→豚検出） |
| フレーズ | 現場日本語の定型対訳（点呼・伝票・荷役・荷主・事故） |

---

## 4. openspec Structure

```txt
openspec/
├── specs/                          # 確定済み振る舞い仕様（マージ後に集約）
└── changes/
    ├── archive/                    # 完了した変更
    └── {issue_slug}/               # Issue 単位の変更提案（例: 0001-halal-scan）
        ├── proposal.md
        ├── design.md
        ├── tasks.md
        └── specs/                  # ドメイン別の振る舞い差分
```

---

## 5. Directory Responsibility

| サブディレクトリ | 責務 |
|---|---|
| `architecture/` | 全体構成・インフラ・開発フロー・テスト標準・本書 |
| `requirements/` | 何を・なぜ作るか（BR / FR / NFR / UC） |
| `specifications/` | どう実装するか（画面 / データサービス / データ / 外部連携） |
| `openspec/` | 受入済み振る舞い仕様と Issue 単位の変更提案 |

---

## 6. Update Rules

- `docs/architecture/` は全体構成、`requirements/` は何を・なぜ、`specifications/` はどう作るかを扱う。
- `docs/` 配下の追加・削除・責務変更時は本書を更新する。`file-list.md` は作らない。
- `app/` / `services/` のソース内部構成は、実装着手後に各 `readme` または個別設計で管理する。
