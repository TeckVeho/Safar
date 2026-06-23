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
| インフラ | GCP Cloud Run + Cloud SQL（プロジェクト `dx-safar`） |
| OCR/翻訳 | Cloud Vision / Cloud Translation（今後連携） |

## GCP デプロイ（dev）

ローカル開発とは別に、GCP 上の dev 環境へデプロイする手順は **[google-cloud/DEPLOY_GUIDE.md](./google-cloud/DEPLOY_GUIDE.md)** を参照（インフラ作成からビルド・マイグレーション・スモークテストまで）。

### 前提

- [Google Cloud SDK](https://cloud.google.com/sdk/docs/install)（`gcloud`）
- [Terraform](https://developer.hashicorp.com/terraform/downloads) `>= 1.5`、[Terragrunt](https://terragrunt.gruntwork.io/)（推奨）
- プロジェクト `dx-safar` へのアクセス権（Owner / Editor または deployer ロール）
- Windows の場合: 下記 bash スクリプトは **Git Bash または WSL** で実行

### クイックリファレンス

```bash
# 認証・プロジェクト
gcloud auth login
gcloud auth application-default login
gcloud config set project dx-safar

# 初回のみ: Terraform（tfvars は *.example からコピーして編集）
cd google-cloud/terraform/live/bootstrap && terragrunt apply
cd ../dev/network && terragrunt apply
cd ../app && terragrunt apply

# アプリのビルド + migrate + Cloud Run デプロイ
bash google-cloud/scripts/cloud-build-submit.sh google-cloud/cloudbuild/cloudbuild.dev.yaml

# URL 確認
cd google-cloud/terraform/live/dev/app && terragrunt output
```

| リソース（dev） | 名前 |
|---|---|
| Cloud Run（モノリス） | `dx-safar-api-dev` |
| Migrate Job | `dx-safar-migrate-dev` |
| Cloud SQL | `dx-safar-mysql-dev` |
| Artifact Registry | `dx-safar-docker` / イメージ `safar-app` |

DB マイグレーションのみ再実行する場合:

```bash
export MIGRATE_JOB_NAME="$(cd google-cloud/terraform/live/dev/app && terragrunt output -raw cloud_run_migrate_job_name)"
bash google-cloud/scripts/run-migrate-job.sh
```

インフラ構成の概要: [docs/architecture/infrastructure.md](./docs/architecture/infrastructure.md)

## ディレクトリ

```txt
app/              Next.js 画面・API
components/       共有 UI
lib/              ビジネスロジック
prisma/           DB スキーマ・seed・migrations
google-cloud/     Terraform、Cloud Build、デプロイスクリプト
tests/            単体テスト
docs/             設計・要件・仕様
openspec/         振る舞い仕様・変更提案
```

## MVP 実装状況

- [x] プロジェクト scaffold
- [x] ハラル判定ロジック + API
- [x] ホーム / ハラルスキャナ / オンボーディング画面
- [x] 荷物チェック（ロジック + API + UI）
- [x] フレーズ集（API + UI）
- [x] 伝票翻訳（glossary ベース）
- [x] 設定（言語切替・位置情報同意）
- [x] スキャン履歴（localStorage）
- [ ] オフラインキャッシュ（Service Worker）
- [ ] Cloud Vision OCR 連携

詳細は [docs/team-guide.md](./docs/team-guide.md) を参照。

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
