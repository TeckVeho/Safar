# Tasks: Issue #0001 — コンビニ・ハラル判定

PR ごとに進捗管理。`[ ]` 未了 / `[x]` 完了。

---

## Phase 0 — 準備

- [x] Issue #0001 作成（Background / AC）
- [x] OpenSpec change `0001-halal-scan` 作成（proposal / design / tasks / specs）
- [ ] ブランチ `feature/0001-halal-scan`
- [ ] 関連 docs 更新要否確認（data-services / db-schema 補足）

---

## Phase 1 — データサービス

- [ ] `product` / `ng_ingredient` のデータ定義（db-schema に整合）
- [ ] NG 成分辞書 初期版（豚 / アルコール / ゼラチン、表記ゆれ）
- [ ] JAN 照合 → OCR フォールバックの判定パイプライン
- [ ] 区分判定 + 根拠生成 + 安全側フォールバック
- [ ] Backend 単体テスト：辞書照合・区分・maybe ルール
- [ ] Backend 結合テスト：経路（jan/ocr/none）・根拠付与

---

## Phase 2 — アプリ（SCR-003）

- [ ] カメラ起動・JAN 読取・OCR フォールバック
- [ ] 判定 API 呼び出し・結果カード（バッジ＋根拠）
- [ ] `userMustConfirm` 時の注意文言表示
- [ ] Frontend 単体テスト：区分→表示マッピング
- [ ] SCR-004 への遷移（プレースホルダ可）

---

## Phase 3 — 仕上げ

- [ ] 手動テスト：UC-002（実商品スキャン、maybe 文言）
- [ ] `docs/specifications/backend/data-services.md` に判定の補足追記
- [ ] PR 作成（Summary / Docs・OpenSpec 更新 / テスト結果 / `Closes #0001`）
- [ ] レビュー対応
- [ ] マージ後：`openspec/changes/0001-halal-scan` を `archive/` へ移動し `openspec/specs/` に集約

---

## Definition of Done

- [ ] proposal.md の Acceptance Criteria を満たす
- [ ] Standard Policy に沿って PR 前に単体/結合テストが通る
- [ ] specs/halal-scan.md のシナリオを検証
- [ ] 確証なしで `ok` を返さない（安全側、NFR-004）

---

## Dependencies

| 依存 | 状態 |
|---|---|
| 商品DB（限定セット） | 別 Issue（調達運用） |
| OCR エンジン | TBD（architecture A3） |
| db-schema `product`/`ng_ingredient` | ドラフト定義済み |
