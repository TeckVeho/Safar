# Data Schema

## 1. Overview

本書はデータサービスが扱うデータ定義（商品/フレーズ/店舗等）をまとめる。ストレージ製品・ID 形式・同期方式は **TBD**。実装着手の Issue で確定する。

| 項目 | 値 |
|---|---|
| データストア | TBD |
| ID 形式 | TBD（UUID 想定） |
| タイムゾーン | UTC |
| オフライン同期 | TBD（[architecture.md](../../architecture/architecture.md) A5） |

---

## 2. 主なエンティティ（論理）

```txt
product            # 商品（JAN→成分）
ng_ingredient      # NG成分辞書（豚/アルコール/動物性ゼラチン等）
phrase             # 現場フレーズ定型対訳
store              # ハラル/ムスリムフレンドリー店・コンビニ食
```

---

## 3. テーブル定義（ドラフト）

### 3.1 `product`

| 列 | 型 | 必須 | 説明 |
|---|---|---|---|
| jan | string | Yes | JAN コード（PK 候補） |
| name | string | Yes | 商品名 |
| ingredients_raw | text | No | 原材料表示（日本語） |
| flags | json | No | 検出フラグ（pork/alcohol/gelatin 等） |
| verdict | enum | No | ok / avoid / maybe（キャッシュ） |
| updated_at | datetime | Yes | 更新日時 |

### 3.2 `ng_ingredient`

| 列 | 型 | 必須 | 説明 |
|---|---|---|---|
| id | TBD | Yes | ID |
| category | enum | Yes | pork / alcohol / gelatin / other |
| term | string | Yes | 表記ゆれを含む語（みりん・料理酒等） |
| note | string | No | 補足 |

### 3.3 `phrase`

| 列 | 型 | 必須 | 説明 |
|---|---|---|---|
| id | TBD | Yes | ID |
| category | enum | Yes | 点呼/伝票/荷役/荷主/事故 |
| ja | string | Yes | 日本語 |
| ru | string | Yes | ロシア語 |
| uz | string | No | ウズベク語〔P2〕 |

### 3.4 `store`

店舗情報。詳細は実装 Issue で定義。

---

## 4. Notes

- 上記は論理ドラフト。型・キー・インデックス・ソフトデリートは実装時に確定。
- 要配慮情報（位置・信仰）は最小収集・暗号化（NFR-003）。利用者個人の信仰データはサーバーに保持しない方針を基本とする（TBD）。
