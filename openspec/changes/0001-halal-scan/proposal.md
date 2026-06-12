# Proposal: Issue #0001 — コンビニ・ハラル判定（MVP 初期実装）

| 項目 | 内容 |
|---|---|
| Issue | #0001（サンプル） |
| Change slug | `0001-halal-scan` |
| Milestone | M1 — 走る一日 MVP |
| Work type | New development / Feature development |
| Status | サンプル（実装なし） |

---

## Background

MVP の検証仮説は「走行中の摩擦を消すと、採用・定着が動くか」（機能概要書 第5章）。中でも **食（コンビニ・ハラル判定）** はドライバーが最も高頻度で触れる痛点（[functional-requirements.md](../../../docs/requirements/functional-requirements.md) FR-006〜FR-009、UC-002）。本変更はその初期実装をスコープする。

---

## Purpose

棚の前で商品をスキャンし、「食べてOK／避けて／疑わしい」を **根拠付き** で即時に判断できるようにする。確証がない場合は安全側（疑わしい）に倒す。

---

## Scope

### In scope

| ID | 内容 |
|---|---|
| FR-006 | JAN / 成分 OCR 読取 |
| FR-007 | 豚由来・アルコール・動物性ゼラチン検出 |
| FR-008 | 3 区分＋根拠の提示 |
| FR-009 | 安全側フォールバック（maybe） |
| SCR-003 | ハラルスキャナ画面 |
| UC-002 | コンビニ商品のハラル可否判定 |

- データサービス：ハラル判定（JAN 照合 → OCR フォールバック → NG 成分辞書照合）
- NG 成分辞書（豚 / アルコール〔みりん・料理酒等〕/ 動物性ゼラチン）初期版
- 単体・結合テスト（判定区分・根拠・安全側）

### Out of scope

| ID | 理由 |
|---|---|
| FR-010, FR-011 | 食べられるものリスト/ルート上店舗は別 Issue |
| オフライン判定の全件キャッシュ | キャッシュ範囲は別途検討（architecture A5） |
| 商品DB の本格調達運用 | MVP は限定セット。調達運用は別 Issue |

---

## Requirements（抜粋）

1. JAN を優先し、未登録/読取不可時は成分 OCR にフォールバックする（FR-006）。
2. 豚由来・アルコール・動物性ゼラチンを検出する（FR-007）。
3. 結果に検出根拠（成分名・該当箇所）を付ける（FR-008）。
4. 由来不明・情報不足は必ず `maybe` とし、`ok` を返さない（FR-009 / NFR-004）。
5. `maybe` 時は最終判断がユーザーである旨を表示する。

---

## Acceptance Criteria

- [ ] JAN 既知商品で `ok` / `avoid` を根拠付きで判定できる
- [ ] 成分に「みりん」「料理酒」を含む商品を `avoid`（アルコール）と判定する
- [ ] ゼラチン由来が表記されない商品を `maybe` と判定する
- [ ] JAN 未登録かつ OCR 失敗時は `maybe`（情報不足）を返す
- [ ] すべての結果に根拠フィールドが付与される
- [ ] 単体テスト：NG 成分辞書照合・区分判定
- [ ] 結合テスト：JAN 照合 → OCR フォールバック → 判定の経路

---

## Risks and mitigations

| Risk | Mitigation |
|---|---|
| 成分表記ゆれで NG を取りこぼす | 辞書に表記ゆれを登録、未検出寄りは `maybe` に倒す |
| 誤 `ok` の健康・信仰リスク | 安全側フォールバックを必須化（NFR-004）、根拠提示で利用者が再確認可 |
| OCR 精度 | JAN 優先、OCR 失敗は `maybe` |

---

## Related documents

- `docs/requirements/functional-requirements.md` — FR-006〜FR-009
- `docs/requirements/use-case.md` — UC-002
- `docs/specifications/frontend/screens/halal-scanner.md` — SCR-003
- `docs/specifications/backend/data-services.md` — §3 ハラル判定
- `docs/specifications/backend/db-schema.md` — `product` / `ng_ingredient`

---

## Notes

AIDD テンプレートに沿った **OpenSpec サンプル**。実装は含まない。
