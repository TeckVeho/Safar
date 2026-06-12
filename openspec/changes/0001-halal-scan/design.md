# Design: Issue #0001 — コンビニ・ハラル判定

## 1. Overview

SCR-003（ハラルスキャナ）を端末側に、判定をデータサービス側に置く。端末は入力（JAN/OCR）と表示を担い、判定ロジックはサーバー（または共有モジュール）で実行する。

```txt
端末 SCR-003
  │ カメラ → JAN / 成分OCRテキスト
  ▼
ハラル判定サービス
  ├─ 1. JAN 照合（product）
  ├─ 2. 未登録/失敗 → OCR テキスト解析
  ├─ 3. NG 成分辞書照合（ng_ingredient）
  └─ 4. 区分 + 根拠 生成
  ▼
結果: { verdict, reasons[], userMustConfirm }
```

---

## 2. 判定 I/O

### 入力
| 項目 | 型 | 説明 |
|---|---|---|
| jan | string? | JAN コード（あれば優先） |
| ocrText | string? | 成分ラベル OCR テキスト |

### 出力
```json
{
  "verdict": "ok | avoid | maybe",
  "reasons": [{ "category": "alcohol", "term": "みりん", "span": "原材料: …みりん…" }],
  "userMustConfirm": true,
  "source": "jan | ocr | none"
}
```

---

## 3. 判定ロジック（FR-007〜009）

1. `jan` があれば `product` を照合し成分/フラグ取得。
2. 取得不可なら `ocrText` を正規化し、`ng_ingredient.term`（表記ゆれ含む）で部分一致検索。
3. NG 検出あり → `avoid`（reasons に該当語）。
4. NG 検出なし かつ 情報が十分 → `ok`。
5. 由来不明（例: gelatin 検出だが由来表記なし）・情報不足・入力なし → `maybe`。
6. `maybe`/`avoid` および全ケースで `reasons` を返す。`ok` 以外は `userMustConfirm=true`。

**安全側ルール（NFR-004）**：判定根拠が不十分なときは `ok` を返さない。

---

## 4. データ

- `product`（jan, ingredients_raw, flags, verdict キャッシュ）
- `ng_ingredient`（category, term 表記ゆれ）
- 初期辞書例：pork=豚/ポーク/ラード、alcohol=みりん/料理酒/酒精/アルコール、gelatin=ゼラチン（由来不明時 maybe）

---

## 5. Frontend（SCR-003）

- カメラ起動 → JAN 優先、失敗で OCR。
- 結果カードに区分バッジ（ok=緑/avoid=赤/maybe=サフラン）＋ reasons。
- `userMustConfirm` 時は「最終判断はご自身で」を表示。

---

## 6. Testing

| レイヤ | 対象 |
|---|---|
| Backend unit | NG 成分辞書照合、区分判定、安全側フォールバック |
| Backend integration | JAN 照合 → OCR フォールバック → 判定の経路、根拠付与 |
| Frontend unit | 区分→バッジ/文言マッピング、userMustConfirm 表示 |
| Manual | 実商品でのスキャン（UC-002）、maybe の文言確認 |

---

## 7. Open questions

| # | 質問 | 暫定 |
|---|---|---|
| Q1 | 商品DB の調達元 | MVP は限定セット、別 Issue |
| Q2 | OCR は端末内/クラウド | TBD（architecture A3） |
| Q3 | オフライン判定キャッシュ範囲 | 頻出商品のみ、別途（A5） |
