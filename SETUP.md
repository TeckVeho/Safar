# Safar — 開発セットアップ

Next.js (App Router) + MySQL (Cloud SQL) + GCP (Cloud Run) 向け PWA アプリ。

## 前提

- Node.js 22+
- Docker（ローカル MySQL）

## 初回セットアップ

```bash
cp .env.example .env
docker compose up -d
npm install
npm run db:push
npm run db:seed
npm run dev
```

http://localhost:3000 で起動。

## 主要コマンド

| コマンド | 説明 |
|---|---|
| `npm run dev` | 開発サーバー |
| `npm run dev:clean` | `.next` を削除してから開発サーバー起動 |
| `npm run dev:turbo` | Turbopack 有効で開発 |
| `npm run build` | 本番ビルド |
| `npm test` | 単体テスト |
| `npm run db:migrate` | Prisma migrate |
| `npm run db:seed` | 初期データ投入 |

## 技術スタック

| レイヤー | 技術 |
|---|---|
| Frontend | Next.js 15 (App Router) + Tailwind CSS 4 |
| Backend | Next.js Route Handlers |
| DB | MySQL 8 + Prisma |
| インフラ | GCP Cloud Run + Cloud SQL |
| OCR/翻訳 | Cloud Vision / Cloud Translation（今後連携） |

## ディレクトリ

```txt
app/           Next.js 画面・API
components/    共有 UI
lib/           ビジネスロジック
prisma/        DB スキーマ・seed
tests/         単体テスト
docs/          設計・要件・仕様
openspec/      振る舞い仕様・変更提案
```

## MVP 実装状況

- [x] プロジェクト scaffold
- [x] ハラル判定ロジック + API
- [x] ホーム / ハラルスキャナ / オンボーディング画面
- [ ] 荷物チェック
- [ ] フレーズ集
- [ ] オフラインキャッシュ（Service Worker）
- [ ] Cloud Vision OCR 連携

## トラブルシューティング

### 全画面が「Internal Server Error」になる

`npm run build` を `npm run dev` 実行中に走らせると `.next` キャッシュが壊れることがあります。

```bash
# 開発サーバーを止めてから
npm run dev:clean
```

または手動で:

```bash
lsof -ti :3000 | xargs kill -9
rm -rf .next
npm run dev
```

**注意:** 開発中は `npm run build` と `npm run dev` を同時に実行しないでください。
