# Spec delta: ハラル判定（halal-scan）

| 項目 | 内容 |
|---|---|
| Domain | `halal-scan` |
| Related FR | FR-006, FR-007, FR-008, FR-009 |
| Related UC | UC-002 |
| Related screen | SCR-003 |
| Change | `0001-halal-scan`（ADDED — MVP 初期実装） |

---

## ADDED Requirements

### Requirement: HS-001 入力の取得とフォールバック

システムは JAN を優先し、未登録/読取不可時は成分 OCR テキストで判定 MUST（FR-006）。

#### Scenario: JAN 既知商品を判定

- **GIVEN** `product` に JAN `4901234567894`（豚・アルコール不使用）が登録されている
- **WHEN** 端末が JAN `4901234567894` で判定を要求する
- **THEN** `verdict` は `ok`
- **AND** `source` は `jan`

#### Scenario: JAN 未登録で OCR にフォールバック

- **GIVEN** JAN が `product` に未登録
- **AND** 成分 OCR テキストに「豚脂」を含む
- **WHEN** 端末が JAN と OCR テキストを送る
- **THEN** `verdict` は `avoid`
- **AND** `source` は `ocr`

---

### Requirement: HS-002 NG 成分の検出

システムは豚由来・アルコール・動物性ゼラチンを検出 MUST（FR-007）。

#### Scenario: アルコール（みりん）を検出

- **GIVEN** 成分に「みりん」を含む商品
- **WHEN** 判定を要求する
- **THEN** `verdict` は `avoid`
- **AND** `reasons` に `{ category: "alcohol", term: "みりん" }` を含む

#### Scenario: 豚（ポークまん）を検出

- **GIVEN** 成分に「豚肉」を含むポークカレーまん
- **WHEN** 判定を要求する
- **THEN** `verdict` は `avoid`
- **AND** `reasons` に豚由来の根拠を含む

---

### Requirement: HS-003 根拠付き 3 区分

システムは `ok / avoid / maybe` を根拠付きで返す MUST（FR-008）。

#### Scenario: OK 商品に根拠が付く

- **GIVEN** 焼きおにぎり（昆布、豚・アルコール不使用）
- **WHEN** 判定を要求する
- **THEN** `verdict` は `ok`
- **AND** `reasons` は「豚・アルコール不使用」を示す

---

### Requirement: HS-004 安全側フォールバック

確証が持てない場合、システムは `maybe` を返し `ok` を返さない MUST（FR-009 / NFR-004）。

#### Scenario: ゼラチン由来不明は maybe

- **GIVEN** グミ（果汁）で「ゼラチン」を含むが由来表記がない
- **WHEN** 判定を要求する
- **THEN** `verdict` は `maybe`
- **AND** `reasons` に「ゼラチンの由来が不明」を含む
- **AND** `userMustConfirm` は `true`

#### Scenario: 情報不足は maybe

- **GIVEN** JAN 未登録 かつ OCR テキストが取得できない
- **WHEN** 判定を要求する
- **THEN** `verdict` は `maybe`
- **AND** `source` は `none`
- **AND** `ok` を返さない

---

## MODIFIED Requirements

（なし — 新規 ADDED）

## REMOVED Requirements

（なし）
