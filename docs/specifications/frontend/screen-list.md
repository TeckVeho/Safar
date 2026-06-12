# Screen List

## 1. Overview

本書は Safar モバイルアプリの画面索引とナビゲーションを定義する。出典は `Safar_要件定義書.md` 5章および `safar-lp-driver.html` の UX。

- 画面詳細：`screens/` 配下の個別仕様
- 共有 UI 部品：`components/` 配下の個別仕様
- データ API：`../backend/data-services.md` ／ 外部連携：`../backend/external-api-spec.md`

各画面に一意の `Screen ID` を付与し、FR / UC との対応を明示する。

### 1.1 前提
- 利用文脈は運転中・荷役中・圏外。**音声ファースト**・**通知主体**を基本とする（NFR-002）。
- LP のマーケ要素（利用者の声・App/Play バッジ・B2B 問い合わせ導線）はアプリ機能ではない。

---

## 2. Screen List

| Screen ID | 画面 | Summary | Priority | Phase | 詳細仕様 |
|---|---|---|---|---|---|
| SCR-001 | ホーム | メイン画面。荷物チェック・ハラルスキャン・フレーズ集・近くのハラル店へのクイックアクセス | Must | MVP | `screens/home.md` |
| SCR-003 | ハラルスキャナ | カメラ起動・JAN/OCR 読取・3区分＋根拠 | Must | MVP | `screens/halal-scanner.md` |
| SCR-004 | 食べられるものリスト | コンビニ別リスト・ルート上ハラル店 | Should | MVP〜P2 | `screens/eatable-list.md` |
| SCR-005 | フレーズ集 | カテゴリ（点呼/伝票/荷役/荷主/事故）・対訳・読み上げ | Must | MVP | `screens/phrases.md` |
| SCR-006 | 伝票カメラ翻訳 | 撮影→OCR→対象言語訳 | Must | MVP | `screens/slip-translate.md` |
| SCR-007 | 設定 | 言語切替・プライバシー同意 | Must | MVP | `screens/settings.md` |
| SCR-008 | オンボーディング | 言語設定 | Must | MVP | `screens/onboarding.md` |
| SCR-009 | 荷物チェック | 伝票スキャン・バーコード読取→豚含有品アラート | Must | MVP | `screens/cargo-check.md` |
| SCR-101 | B2B ダッシュボード | 稼働・定着の可視化、配車・点呼連携 | Should | P2 | `screens/b2b-dashboard.md` |

> MVP で詳細仕様を先行作成するのは SCR-001 / SCR-003 / SCR-005 / SCR-009。他画面は実装着手の Issue 時に追補する。

---

## 3. Requirements Traceability

| Screen ID | Related FR | Related UC | Notes |
|---|---|---|---|
| SCR-001 | FR-006〜FR-009, FR-026〜FR-029, FR-012, FR-019, FR-021 | UC-002, UC-008 | 食・荷物・言葉への統合ホーム |
| SCR-003 | FR-006, FR-007, FR-008, FR-009 | UC-002 | 安全側フォールバック必須 |
| SCR-004 | FR-010, FR-011 | UC-003 | |
| SCR-005 | FR-012, FR-014 | UC-005 | 点呼/事故対応を含む |
| SCR-006 | FR-013, FR-014 | UC-004 | OCR 翻訳 |
| SCR-007 | FR-021, FR-022 | UC-006 | 同意フロー・言語 |
| SCR-008 | FR-021 | UC-006 | 言語設定 |
| SCR-009 | FR-026, FR-027, FR-028, FR-029 | UC-008 | 伝票OCR・JAN→豚含有判定 |
| SCR-101 | FR-023, FR-024, FR-025 | UC-007 | P2 |

---

## 4. Navigation

```txt
SCR-008 オンボーディング
   └─▶ SCR-001 ホーム（中心）
         ├─▶ SCR-009 荷物チェック
         ├─▶ SCR-003 ハラルスキャナ
         │      └─▶ SCR-004 食べられるものリスト
         ├─▶ SCR-005 フレーズ集
         │      └─▶ SCR-006 伝票カメラ翻訳
         └─▶ SCR-007 設定
```
