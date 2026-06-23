# Safar — Hướng dẫn nắm bắt dự án cho team

Tài liệu này tổng hợp **mục đích dự án**, **các chức năng**, **công nghệ**, **cấu trúc code** và **trạng thái triển khai** để thành viên mới nhanh chóng hiểu và tham gia phát triển.

> Tài liệu thiết kế chi tiết (tiếng Nhật) nằm trong `docs/requirements/` và `docs/specifications/`. Tài liệu này là điểm bắt đầu; khi cần spec đầy đủ, đọc thêm các file được liên kết ở cuối.

---

## 1. Safar là gì?

**Safar** là ứng dụng hỗ trợ **tài xế Muslim từ Trung Á** (chủ yếu nói tiếng Nga) chạy xe tải tại Nhật Bản.

Trọng tâm: giải quyết ma sát trong ca làm việc — **thức ăn · hàng hóa · ngôn ngữ** — không bao gồm visa, đời sống hàng ngày, hay cộng đồng.

| Lĩnh vực | Vấn đề thực tế | Giải pháp Safar |
|----------|----------------|-----------------|
| **Thức ăn (食)** | Không biết sản phẩm combini/siêu thị có halal không | Quét mã JAN / đọc thành phần → phán quyết 3 mức |
| **Hàng hóa (荷物)** | Không biết đơn hàng có chứa thịt heo không | Kiểm tra hóa đơn / quét JAN → cảnh báo trước khi xếp hàng |
| **Ngôn ngữ (言葉)** | Không hiểu tiếng Nhật tại hiện trường (điểm danh, hóa đơn, tai nạn…) | Bộ cụm từ định sẵn + dịch hóa đơn |
| **Nền tảng (基盤)** | Lái xe, vùng mất sóng | PWA mobile-first, đa ngôn ngữ, (kế hoạch) offline |

**Đối tượng người dùng:** Tài xế xe tải Muslim từ Trung Á đang làm việc tại Nhật.  
**Ngôn ngữ UI:** Tiếng Nga (chính), Tiếng Nhật; Tiếng Uzbek (Phase 2).  
**Hình thức triển khai:** PWA (Progressive Web App) chạy trên trình duyệt mobile, deploy lên GCP Cloud Run.

---

## 2. Các chức năng chính

### 2.1 Tổng quan màn hình

```
Onboarding (SCR-008)
   └─▶ Trang chủ (SCR-001)
         ├─▶ Kiểm tra hàng hóa (SCR-009)
         ├─▶ Quét Halal (SCR-003)
         ├─▶ Bộ cụm từ (SCR-005)
         │      └─▶ Dịch hóa đơn (SCR-006)
         └─▶ Cài đặt (SCR-007)
```

| Screen ID | Màn hình | Route | Mô tả ngắn |
|-----------|----------|-------|------------|
| SCR-008 | Onboarding | `/onboarding` | Chọn ngôn ngữ lần đầu |
| SCR-001 | Trang chủ | `/` | Quick actions + lịch sử quét gần đây |
| SCR-003 | Quét Halal | `/halal-scanner` | Quét JAN / nhập thành phần → phán quyết halal |
| SCR-009 | Kiểm tra hàng | `/cargo-check` | Phát hiện hàng chứa thịt heo |
| SCR-005 | Bộ cụm từ | `/phrases` | Cụm từ hiện trường theo danh mục |
| SCR-006 | Dịch hóa đơn | `/invoice-translate` | Dịch nội dung hóa đơn sang tiếng Nga |
| SCR-007 | Cài đặt | `/settings` | Đổi ngôn ngữ, đồng ý vị trí |
| SCR-004 | Danh sách ăn được | — | Chưa triển khai (MVP~P2) |
| SCR-101 | B2B Dashboard | — | Phase 2 |

---

### 2.2 Quét Halal (Halal Scanner) — SCR-003

**Mục đích:** Tài xế đứng trước kệ combini/siêu thị, quét sản phẩm và biết ngay có ăn được không.

**Cách hoạt động:**

1. User quét mã JAN bằng camera (`@zxing/browser`) hoặc nhập tay mã JAN / text thành phần.
2. Gọi `POST /api/halal/judge`.
3. Server tra cứu sản phẩm theo JAN:
   - Tìm trong DB local (`product`)
   - Nếu chưa có → gọi **Open Food Facts API** → lưu vào DB
4. Phân tích thành phần qua **từ điển NG** (`ng_ingredient`): heo, rượu, gelatin…
5. Trả về **3 mức phán quyết** kèm lý do:

| Verdict | Ý nghĩa | Điều kiện |
|---------|---------|-----------|
| `ok` | Ăn được | Không phát hiện thành phần cấm |
| `avoid` | Tránh | Phát hiện heo / rượu / gelatin động vật… |
| `maybe` | Nghi ngờ | Gelatin không rõ nguồn gốc, thiếu thông tin |

**Nguyên tắc an toàn:** Khi không chắc chắn → luôn trả `maybe`, không trả `ok` tùy tiện. User phải tự quyết định cuối cùng.

**Code chính:**
- Logic: `lib/halal/judge.ts`, `lib/halal/ng-dictionary.ts`
- API: `app/api/halal/judge/route.ts`
- UI: `components/halal-scanner-client.tsx`, `components/barcode-scanner.tsx`

**FR liên quan:** FR-006, FR-007, FR-008, FR-009

---

### 2.3 Kiểm tra hàng hóa (Cargo Check) — SCR-009

**Mục đích:** Trước khi xếp hàng lên xe, tài xế kiểm tra đơn hàng có chứa sản phẩm từ heo không (vì lý do tín ngưỡng).

**Hai chế độ:**

| Chế độ | Input | Xử lý |
|--------|-------|-------|
| Quét JAN đơn | Mã JAN 13 số | Tra DB → kiểm tra thành phần heo |
| Danh sách hàng | Text hóa đơn (nhiều dòng) | Parse từng dòng, trích JAN nếu có → kiểm tra từng item |

**Kết quả:**
- `hasAnyPork: true` → Cảnh báo + gợi ý (đeo găng, liên hệ chủ hàng, thay thế…)
- `hasAnyPork: false` → Xác nhận không có heo

**Dùng chung:** Cùng bảng `product` và `ng_ingredient` với Halal Scanner, nhưng chỉ lọc category `pork`.

**Code chính:**
- Logic: `lib/cargo/judge.ts`, `lib/cargo/parse-items.ts`
- API: `app/api/cargo/check/route.ts`
- UI: `components/cargo-check-client.tsx`

**FR liên quan:** FR-026, FR-027, FR-028, FR-029

**Chưa có:** OCR hóa đơn thật (chụp ảnh → tự đọc text). Hiện user paste/nhập text thủ công.

---

### 2.4 Bộ cụm từ (Phrases) — SCR-005

**Mục đích:** Cung cấp câu tiếng Nhật thường dùng tại hiện trường, kèm bản dịch tiếng Nga.

**5 danh mục:**

| Category | Tiếng Nhật | Tình huống |
|----------|------------|------------|
| `tenko` | 点呼 | Điểm danh / roll call |
| `denpyo` | 伝票 | Hóa đơn, chứng từ |
| `niyaku` | 荷役 | Bốc dỡ hàng |
| `ninushi` | 荷主 | Chủ hàng |
| `jiko` | 事故 | Tai nạn / sự cố |

**Tính năng UI:**
- Lọc theo danh mục
- Nút **Speak** — dùng Web Speech API đọc tiếng Nhật hoặc Nga
- Link sang trang dịch hóa đơn

**Code chính:**
- API: `GET /api/phrases` → đọc bảng `phrase`
- UI: `components/phrases-client.tsx`
- Seed data: `prisma/seed.ts`

**FR liên quan:** FR-012, FR-014 (voice — một phần)

---

### 2.5 Dịch hóa đơn (Invoice Translate) — SCR-006

**Mục đích:** Dịch nội dung hóa đơn / phiếu giao hàng từ tiếng Nhật sang tiếng Nga.

**Cách hoạt động hiện tại:**
- User paste text tiếng Nhật
- `POST /api/translate/invoice` → thay thế theo **glossary** (từ điển thuật ngữ cố định)
- Không dùng Cloud Translation API (chưa tích hợp)

**Code chính:**
- Logic: `lib/translate/invoice.ts`, `lib/translate/glossary.ts`
- API: `app/api/translate/invoice/route.ts`
- UI: `components/invoice-translate-client.tsx`

**FR liên quan:** FR-013

**Kế hoạch:** Tích hợp Cloud Vision OCR (chụp ảnh) + Cloud Translation.

---

### 2.6 Trang chủ (Home) — SCR-001

**Nội dung:**
- Header với logo và tagline
- 4 quick action cards: Halal Scanner, Cargo Check, Phrases, Settings
- **Recent Scans** — lịch sử quét gần đây (lưu `localStorage`, không qua server)

**Code:** `app/page.tsx`, `components/recent-scans.tsx`, `lib/scan-history/`

---

### 2.7 Onboarding — SCR-008

**Mục đích:** Lần đầu mở app, user chọn ngôn ngữ (ru / ja).

- Lưu cookie `safar_locale`
- Sau khi chọn → redirect về trang chủ
- Splash screen + walkthrough giới thiệu app

**Code:** `app/onboarding/page.tsx`, `components/launch-flow.tsx`, `components/splash-screen.tsx`

---

### 2.8 Cài đặt (Settings) — SCR-007

**Tính năng:**
- Đổi ngôn ngữ UI (form action server-side)
- Toggle đồng ý vị trí (lưu `localStorage`, chưa gọi GPS thật)

**Code:** `app/settings/page.tsx`, `components/settings-client.tsx`

**FR liên quan:** FR-021, FR-022

---

### 2.9 Chức năng chưa triển khai / Phase 2

| Chức năng | Phase | Ghi chú |
|-----------|-------|---------|
| Danh sách ăn được theo combini | MVP~P2 | SCR-004 |
| Cửa hàng halal trên bản đồ | MVP~P2 | Bảng `store` đã có schema |
| Offline cache (Service Worker) | MVP | FR-019 |
| OCR thật (Cloud Vision) | MVP | FR-006, FR-013, FR-028 |
| Cloud Translation | MVP | FR-013 |
| Voice-first (STT/TTS) | MVP~P2 | FR-014, FR-020 |
| Tiếng Uzbek | P2 | FR-015 |
| B2B Dashboard | P2 | FR-023~025 |

---

## 3. Công nghệ & kiến trúc

### 3.1 Tech stack

| Lớp | Công nghệ | Phiên bản |
|-----|-----------|-----------|
| Framework | Next.js (App Router) | 15.x |
| UI | React | 19.x |
| Ngôn ngữ | TypeScript | 5.x |
| CSS | Tailwind CSS | 4.x |
| ORM | Prisma | 6.x |
| Database | MySQL | 8.x |
| Test | Vitest | 3.x |
| Barcode | @zxing/browser | 0.2.x |
| Deploy | GCP Cloud Run + Cloud SQL | — |
| Container | Docker multi-stage | Node 22 |

### 3.2 Kiến trúc tổng thể

```
┌─────────────────────────────────────────┐
│  PWA (Browser / Mobile)                 │
│  ├─ Pages (app/)                        │
│  ├─ Components (components/)            │
│  ├─ Camera / Barcode (@zxing)           │
│  └─ localStorage (scan history, consent)  │
└──────────────┬──────────────────────────┘
               │ HTTPS / JSON
               ▼
┌─────────────────────────────────────────┐
│  Next.js Server                         │
│  ├─ Route Handlers (app/api/)           │
│  └─ Business Logic (lib/)               │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       ▼                ▼
┌─────────────┐  ┌──────────────────┐
│ MySQL       │  │ Open Food Facts  │
│ (Prisma)    │  │ (external API)   │
└─────────────┘  └──────────────────┘
```

**Đặc điểm:** Monolith full-stack — frontend và backend trong cùng repo Next.js, không tách service riêng.

Build output: `standalone` (tối ưu cho Docker / Cloud Run).

---

## 4. Cấu trúc thư mục

```
Safar/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Trang chủ
│   ├── layout.tsx              # Root layout (font, i18n, AppShell)
│   ├── globals.css             # Tailwind + design tokens
│   ├── halal-scanner/          # Màn quét halal
│   ├── cargo-check/            # Màn kiểm tra hàng
│   ├── phrases/                # Màn cụm từ
│   ├── invoice-translate/      # Màn dịch hóa đơn
│   ├── settings/               # Màn cài đặt
│   ├── onboarding/             # Màn onboarding
│   └── api/                    # REST API
│       ├── halal/judge/        # POST — phán quyết halal
│       ├── cargo/check/        # POST — kiểm tra heo
│       ├── phrases/            # GET — danh sách cụm từ
│       └── translate/invoice/  # POST — dịch hóa đơn
│
├── components/                 # UI components dùng chung
│   ├── app-shell.tsx           # Layout wrapper, onboarding redirect
│   ├── barcode-scanner.tsx     # Camera + ZXing
│   ├── halal-scanner-client.tsx
│   ├── cargo-check-client.tsx
│   ├── phrases-client.tsx
│   ├── verdict-card.tsx        # Card hiển thị kết quả phán quyết
│   └── ...
│
├── lib/                        # Business logic (không phụ thuộc UI)
│   ├── halal/                  # Phán quyết halal + từ điển NG
│   ├── cargo/                  # Kiểm tra hàng heo
│   ├── jan/                    # Tra cứu JAN + Open Food Facts adapter
│   ├── translate/              # Dịch hóa đơn (glossary-based)
│   ├── scan-history/           # Lịch sử quét (localStorage)
│   ├── i18n/                   # Đa ngôn ngữ (ru/ja dictionaries)
│   ├── barcode/                # Parse mã JAN
│   └── db/                     # Prisma client singleton
│
├── prisma/
│   ├── schema.prisma           # DB schema
│   ├── migrations/             # Prisma migrations (deploy lên Cloud SQL)
│   └── seed.ts                 # Dữ liệu mẫu (NG ingredients, phrases, products)
│
├── google-cloud/               # GCP: Terraform, Cloud Build, scripts deploy
│   ├── DEPLOY_GUIDE.md         # Runbook deploy đầy đủ
│   ├── terraform/              # IaC (Terragrunt + modules)
│   ├── cloudbuild/             # cloudbuild.dev.yaml / prod.yaml
│   └── scripts/                # cloud-build-submit.sh, run-migrate-job.sh
│
├── tests/unit/                 # Unit tests (Vitest)
├── docs/                       # Tài liệu thiết kế (AIDD)
├── openspec/                   # Spec hành vi theo issue
├── public/                     # Static assets, PWA manifest
├── Dockerfile                  # Build cho Cloud Run
└── docker-compose.yml          # MySQL local
```

### Quy ước phân tách code

| Thư mục | Trách nhiệm |
|---------|-------------|
| `app/` | Routing, page server components, API route handlers |
| `components/` | Client/Server UI components |
| `lib/` | Pure business logic, không import React |
| `tests/unit/` | Test cho `lib/` — không test UI |

---

## 5. Database

### 5.1 Schema (Prisma)

| Model | Bảng | Mục đích |
|-------|------|----------|
| `Product` | `product` | Sản phẩm theo JAN: tên, thành phần, verdict |
| `NgIngredient` | `ng_ingredient` | Từ điển thành phần cấm (pork/alcohol/gelatin/other) |
| `Phrase` | `phrase` | Cụm từ hiện trường (ja/ru/uz) |
| `Store` | `store` | Cửa hàng halal (lat/lng) — chưa dùng trong UI |

### 5.2 Enum quan trọng

```
Verdict:     ok | avoid | maybe
NgCategory:  pork | alcohol | gelatin | other
PhraseCategory: tenko | denpyo | niyaku | ninushi | jiko
```

Chi tiết: [db-schema.md](./specifications/backend/db-schema.md)

---

## 6. API nội bộ

| Method | Endpoint | Body | Response |
|--------|----------|------|----------|
| POST | `/api/halal/judge` | `{ jan?, ingredientsText? }` | `{ verdict, productName, reasons, userMustConfirm, source }` |
| POST | `/api/cargo/check` | `{ jan?, itemsText? }` | `{ items[], hasAnyPork }` |
| GET | `/api/phrases` | — | `{ phrases[] }` |
| POST | `/api/translate/invoice` | `{ text }` | `{ lines[], fullText }` |

Logic chi tiết: [data-services.md](./specifications/backend/data-services.md)

---

## 7. Đa ngôn ngữ (i18n)

- **Locale:** `ru` (mặc định), `ja`
- **Cơ chế:** Server-side dictionaries trong `lib/i18n/dictionaries.ts`
- **Lưu preference:** Cookie `safar_locale`
- **Font:** Noto Sans (Cyrillic), Noto Sans JP, Zen Kaku Gothic New, Sora

Mỗi page gọi `getDictionary()` để lấy label theo locale hiện tại.

---

## 8. Trạng thái triển khai (MVP)

| Hạng mục | Trạng thái |
|----------|------------|
| Project scaffold | ✅ |
| Halal judge logic + API | ✅ |
| Halal Scanner UI + barcode | ✅ |
| Cargo check logic + API + UI | ✅ |
| Phrases API + UI | ✅ |
| Invoice translate (glossary) | ✅ |
| Home + Onboarding + Settings | ✅ |
| Scan history (localStorage) | ✅ |
| Unit tests (halal, cargo, jan, translate) | ✅ |
| Offline cache (Service Worker) | ❌ |
| Cloud Vision OCR | ❌ |
| Cloud Translation API | ❌ |
| Halal store map | ❌ |
| B2B features | ❌ (P2) |

---

## 9. Cài đặt môi trường dev

```bash
# 1. Clone & cấu hình
cp .env.example .env

# 2. Khởi động MySQL
docker compose up -d

# 3. Cài dependencies & DB
npm install
npm run db:push
npm run db:seed

# 4. Chạy dev server
npm run dev
# → http://localhost:3000
```

**Yêu cầu:** Node.js 22+, Docker.

| Lệnh | Mô tả |
|------|-------|
| `npm run dev` | Dev server |
| `npm run dev:turbo` | Dev với Turbopack |
| `npm run build` | Build production |
| `npm test` | Chạy unit tests |
| `npm run db:migrate` | Prisma migrate |
| `npm run db:seed` | Seed dữ liệu mẫu |

Chi tiết troubleshooting: [SETUP.md](../SETUP.md)

---

## 10. Triển khai GCP (dev)

Safar chạy trên **một GCP project** `dx-safar` (region `asia-northeast1`). Môi trường tách bằng suffix `dev` / `stg` / `prod` trong tên resource. Hiện tại **chỉ dev** đã được bootstrap.

### Kiến trúc deploy

```
Repo (Next.js monolith)
  → Cloud Build (cloudbuild.dev.yaml)
  → Artifact Registry (safar-app:dev)
  → Cloud Run Job migrate (prisma migrate deploy)
  → Cloud Run service dx-safar-api-dev
  → Cloud SQL MySQL (private IP qua VPC)
```

Khác Kumu: **không tách API/web** — một image `safar-app`, một Cloud Run (`enable_web = false` trong Terraform).

### Tài liệu chính

| Tài liệu | Nội dung |
|----------|----------|
| [google-cloud/DEPLOY_GUIDE.md](../google-cloud/DEPLOY_GUIDE.md) | **Runbook đầy đủ** — auth, Terraform, secrets, CI/CD, troubleshooting |
| [google-cloud/README.md](../google-cloud/README.md) | Quick start + index tài liệu GCP |
| [infrastructure.md](./architecture/infrastructure.md) | Tổng quan kiến trúc hạ tầng (tiếng Nhật) |
| [SETUP.md](../SETUP.md) | Quick reference deploy + local dev |

### Chuẩn bị lần đầu (infra)

1. Cài `gcloud`, Terraform, Terragrunt.
2. Đăng nhập: `gcloud auth login` và `gcloud auth application-default login`.
3. Copy `terraform.tfvars` từ các file `*.example` trong `google-cloud/terraform/environments/`.
4. Apply theo thứ tự:

```bash
gcloud config set project dx-safar
cd google-cloud/terraform/live/bootstrap && terragrunt apply
cd ../dev/network && terragrunt apply
cd ../app && terragrunt apply
```

5. Grant Cloud Build SA quyền push Artifact Registry (trong bootstrap tfvars — xem DEPLOY_GUIDE §6.1).

**Secret:** Terraform tự tạo `DATABASE_URL` trong Secret Manager khi `enable_cloud_sql = true`. Safar chưa có auth — **không cần JWT secret**.

### Deploy app (sau khi infra sẵn sàng)

Từ root repo (Git Bash / WSL trên Windows):

```bash
bash google-cloud/scripts/cloud-build-submit.sh google-cloud/cloudbuild/cloudbuild.dev.yaml
```

Pipeline: build Docker → push `asia-northeast1-docker.pkg.dev/dx-safar/dx-safar-docker/safar-app:dev` → chạy migrate job → deploy `dx-safar-api-dev`.

Kiểm tra:

```bash
cd google-cloud/terraform/live/dev/app && terragrunt output
curl -I "$(terragrunt output -raw cloud_run_url)"
```

### Lệnh vận hành thường dùng

| Tác vụ | Lệnh |
|--------|------|
| Chỉ chạy migrate | `export MIGRATE_JOB_NAME="$(cd google-cloud/terraform/live/dev/app && terragrunt output -raw cloud_run_migrate_job_name)"` rồi `bash google-cloud/scripts/run-migrate-job.sh` |
| Seed DB (một lần) | `gcloud run jobs execute dx-safar-migrate-dev --command=npx --args=prisma,db,seed` (override command trên Console/CLI) |
| Xem log Cloud Run | `gcloud run services logs read dx-safar-api-dev --region=asia-northeast1` |
| Plan Terraform | `cd google-cloud/terraform/live && terragrunt run-all plan` |

### CI/CD (tùy chọn)

GitHub Actions workflow `cd-gcp.yml` — branch `develop` → tag `dev`. Cần setup Workload Identity Federation: [GITHUB_ACTIONS_WIF.md](../google-cloud/cloudbuild/GITHUB_ACTIONS_WIF.md).

### Lưu ý vận hành dev

- **`enable_sql_night_weekend_schedule = true`:** SQL tắt ngoài giờ làm việc (JST) để tiết kiệm chi phí — API sẽ lỗi DB nếu gọi lúc SQL đang STOPPED.
- Cloud Build bucket `dx-safar_cloudbuild` có thể đã tồn tại; cần import vào Terraform bootstrap nếu apply báo conflict.
- Chi tiết xử lý sự cố: DEPLOY_GUIDE §11.

---

## 11. Quy trình phát triển (AIDD)

Dự án theo chuẩn **AIDD (AI-Driven Development)**:

```
GitHub Issue
  → OpenSpec (proposal → design → tasks → specs)
  → Implement (app/ + lib/ + tests/)
  → PR (kèm test, cập nhật docs nếu cần)
```

| Thư mục | Vai trò |
|---------|---------|
| `docs/requirements/` | **Cái gì & tại sao** — BR, FR, NFR, Use Case |
| `docs/specifications/` | **Làm thế nào** — màn hình, API, DB schema |
| `docs/architecture/` | Kiến trúc, infra, test strategy, dev flow |
| `openspec/changes/` | Spec hành vi theo từng issue |

Ví dụ OpenSpec: [openspec/changes/0001-halal-scan/](../openspec/changes/0001-halal-scan/)

Chi tiết: [development-flow.md](./architecture/development-flow.md)

---

## 12. Luồng dữ liệu ví dụ — Quét Halal

```
User quét JAN "4901234567890"
        │
        ▼
BarcodeScanner (camera → ZXing)
        │
        ▼
HalalScannerClient → POST /api/halal/judge { jan: "4901234567890" }
        │
        ▼
resolveProductByJan(jan)
  ├─ prisma.product.findUnique(jan)     → có trong DB?
  └─ fetchProductFromOpenFoodFacts(jan) → không có → gọi API ngoài → upsert DB
        │
        ▼
judgeHalal(input, ngDictionary, product)
  ├─ Có gelatin không rõ nguồn? → maybe
  ├─ Match NG ingredient?       → avoid
  └─ Không match                → ok
        │
        ▼
Response → VerdictCard hiển thị kết quả
        │
        ▼
addScanHistoryEntry() → localStorage
```

---

## 13. Tài liệu tham khảo

| Tài liệu | Nội dung |
|----------|----------|
| [readme.md](../readme.md) | Tổng quan repo |
| [SETUP.md](../SETUP.md) | Hướng dẫn cài đặt + quick deploy GCP |
| [google-cloud/DEPLOY_GUIDE.md](../google-cloud/DEPLOY_GUIDE.md) | Runbook deploy GCP đầy đủ |
| [docs/readme.md](./readme.md) | Chính sách AIDD docs |
| [business-requirements.md](./requirements/business-requirements.md) | Yêu cầu nghiệp vụ (BR) |
| [functional-requirements.md](./requirements/functional-requirements.md) | Yêu cầu chức năng (FR) |
| [use-case.md](./requirements/use-case.md) | Use case |
| [screen-list.md](./specifications/frontend/screen-list.md) | Danh sách màn hình |
| [data-services.md](./specifications/backend/data-services.md) | Logic backend |
| [architecture.md](./architecture/architecture.md) | Kiến trúc tổng thể |
| [infrastructure.md](./architecture/infrastructure.md) | Hạ tầng GCP (Cloud Run, SQL, Terraform) |
| [directory-structure.md](./architecture/directory-structure.md) | Cấu trúc thư mục chi tiết |

---

## 14. Glossary (Thuật ngữ)

| Thuật ngữ | Ý nghĩa |
|-----------|---------|
| **JAN** | Japan Article Number — mã vạch 13 số trên sản phẩm Nhật |
| **Halal** | Thực phẩm được phép theo luật Hồi giáo |
| **NG ingredient** | Thành phần cấm (heo, rượu, gelatin…) |
| **Verdict** | Kết quả phán quyết: ok / avoid / maybe |
| **PWA** | Progressive Web App — web app cài được như app native |
| **AIDD** | AI-Driven Development — quy trình phát triển có AI hỗ trợ |
| **OpenSpec** | Spec hành vi theo issue, quản lý thay đổi |
| **MVP** | Minimum Viable Product — phiên bản tối thiểu |
| **P2** | Phase 2 — giai đoạn sau MVP |
