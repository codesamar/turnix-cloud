# TurnixCloud

Unified cloud drive aggregation platform — kelola Google Drive, OneDrive, Dropbox, Yandex, dan S3-compatible storage dari satu workspace.

Dibangun dengan **Next.js 16**, **Supabase** (Postgres, Auth, Realtime), dan **shadcn/ui**.

## Tech Stack

- Next.js 16 (App Router) + React 18 + TypeScript
- Supabase (Auth, Postgres, RLS, Realtime)
- Tailwind CSS + shadcn/ui
- TanStack Query, react-hook-form, zod, recharts

## Prasyarat

- Node.js 20+ (disarankan LTS)
- npm
- Akun [Supabase](https://supabase.com) (gratis)
- (Opsional) OAuth credentials untuk cloud provider yang ingin dihubungkan

---

## Step-by-Step Setup

### 1. Clone & install dependencies

```bash
git clone <repo-url> turnix-cloud
cd turnix-cloud
npm install
```

### 2. Buat project Supabase

1. Buka [Supabase Dashboard](https://supabase.com/dashboard)
2. Klik **New project**
3. Isi nama project, password database, dan region
4. Tunggu hingga project selesai provisioning

Catat dari **Project Settings → API**:
- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (jangan expose ke browser)

### 3. Jalankan migrasi database

Migrasi schema ada di [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql).

#### Cara A — SQL Editor (disarankan)

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Copy seluruh isi file `supabase/migrations/001_initial.sql`
3. Paste → klik **Run**

#### Cara B — Supabase CLI

CLI sudah tersedia sebagai dev dependency project (tidak perlu install global):

```bash
# Login ke Supabase
npx supabase login

# Link ke project (ganti dengan project ref Anda)
npx supabase link --project-ref <your-project-ref>

# Push migrasi
npm run db:push
```

Jika koneksi langsung gagal (mis. error IPv6), gunakan connection string dari Dashboard:

```bash
npm run db:push:url "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

> Connection string ada di **Project Settings → Database → Connection string** (mode **Session pooler**).

#### Verifikasi migrasi

Di Supabase Dashboard → **Table Editor**, pastikan tabel berikut ada:

- `profiles`
- `cloud_accounts`
- `file_metadata`
- `upload_sessions`
- `allocation_config`

### 4. Konfigurasi environment variables

```bash
cp .env.example .env.local
```

Isi `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
TURNIX_SECRET_KEY=generate-a-random-secret-min-32-chars
CRON_SECRET=generate-another-random-secret
```

| Variable | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (aman di browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only, jangan commit) |
| `NEXT_PUBLIC_APP_URL` | URL app lokal/production — dipakai OAuth redirect |
| `TURNIX_SECRET_KEY` | Enkripsi token cloud provider di database (min. 32 karakter) |
| `CRON_SECRET` | Auth untuk Vercel Cron sync (production) |

Generate secret acak:

```bash
openssl rand -base64 32
```

### 5. Konfigurasi Supabase Auth

Di Supabase Dashboard → **Authentication → URL Configuration**:

| Setting | Local dev | Production |
|---|---|---|
| **Site URL** | `http://localhost:3000` | `https://your-domain.com` |
| **Redirect URLs** | `http://localhost:3000/auth/callback` | `https://your-domain.com/auth/callback` |

Pastikan **Enable email signup** aktif di **Authentication → Providers → Email**.

### 6. (Opsional) Setup OAuth cloud providers

Isi credential di `.env.local` untuk provider yang ingin digunakan.

#### Google Drive

1. [Google Cloud Console](https://console.cloud.google.com/) → buat OAuth 2.0 Client ID
2. Authorized redirect URI:
   ```
   http://localhost:3000/api/accounts/google_drive/callback
   ```
3. Isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET`

#### OneDrive

1. [Azure App Registration](https://portal.azure.com/) → New registration
2. Redirect URI (Web):
   ```
   http://localhost:3000/api/accounts/onedrive/callback
   ```
3. API permissions: `Files.ReadWrite.All`, `User.Read`, `offline_access`
4. Isi `ONEDRIVE_CLIENT_ID`, `ONEDRIVE_CLIENT_SECRET`, `ONEDRIVE_TENANT_ID`

#### Dropbox

1. [Dropbox App Console](https://www.dropbox.com/developers/apps) → Create app
2. Redirect URI:
   ```
   http://localhost:3000/api/accounts/dropbox/callback
   ```
3. Isi `DROPBOX_CLIENT_ID` dan `DROPBOX_CLIENT_SECRET`

#### Yandex Disk

1. [Yandex OAuth](https://oauth.yandex.com/) → buat aplikasi
2. Redirect URI:
   ```
   http://localhost:3000/api/accounts/yandex/callback
   ```
3. Isi `YANDEX_CLIENT_ID` dan `YANDEX_CLIENT_SECRET`

#### S3 Compatible

Tidak perlu env var — connect langsung dari UI di halaman **Storage & Accounts** (`/quota`).

> Ganti `http://localhost:3000` dengan `NEXT_PUBLIC_APP_URL` Anda saat production.

### 7. Jalankan development server

```bash
npm run dev
```

App berjalan di [http://localhost:3000](http://localhost:3000).

Jika port sudah terpakai:

```bash
npm run dev -- -p 3500
```

Pastikan `NEXT_PUBLIC_APP_URL` di `.env.local` sesuai port yang dipakai.

### 8. First run — uji alur dasar

1. Buka app → **Register** akun baru
2. Login → masuk ke dashboard
3. Buka **Storage & Accounts** (`/quota`)
4. Klik provider (mis. Google Drive) → authorize OAuth
5. Klik **Sync All** untuk mirror metadata file
6. Buka **My Drive** untuk browse file
7. Upload file via drag-and-drop di **My Drive**

---

## Deploy ke Production (Vercel + Supabase)

### Vercel

1. Push repo ke GitHub
2. Import project di [Vercel](https://vercel.com)
3. Set semua environment variables dari `.env.local`
4. Update `NEXT_PUBLIC_APP_URL` ke domain production
5. Deploy

Vercel Cron sudah dikonfigurasi di [`vercel.json`](vercel.json) — sync otomatis setiap 5 menit via `POST /api/sync/run`.

Set `CRON_SECRET` di Vercel env vars. Vercel otomatis mengirim header `Authorization: Bearer <CRON_SECRET>`.

### Supabase Production

1. Update **Site URL** dan **Redirect URLs** di Supabase Auth ke domain production
2. Update OAuth redirect URIs di masing-masing provider ke domain production

---

## Available Scripts

| Script | Deskripsi |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Build production |
| `npm run start` | Jalankan build production |
| `npm run lint` | ESLint |
| `npm run supabase` | Supabase CLI (via npx) |
| `npm run db:push` | Push migrasi ke linked Supabase project |
| `npm run db:push:url` | Push migrasi dengan connection string |

---

## Struktur Folder

```
turnix-cloud/
├── app/
│   ├── (auth)/          # Login & register
│   ├── (dashboard)/     # Home, My Drive, Recent, Starred, Quota, dll.
│   └── api/             # REST API route handlers
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── files/           # File explorer, upload
│   ├── accounts/        # Connect cloud accounts
│   └── settings/        # User & allocation settings
├── lib/
│   ├── supabase/        # Supabase client helpers
│   ├── adapters/        # Cloud provider adapters
│   └── services/        # Sync, upload, allocation, crypto
├── supabase/
│   └── migrations/      # Database schema SQL
└── .env.local           # Environment variables (jangan commit)
```

---

## Menjalankan dengan Docker

```bash
docker compose up --build
```

Port mapping default: host `3200` → container `3000`  
Akses di [http://localhost:3200](http://localhost:3200)

---

## Troubleshooting

### `supabase: command not found`

CLI tidak terinstall global. Gunakan:

```bash
npx supabase --version
# atau
npm run supabase -- --version
```

### Error koneksi database saat `db push`

Host Supabase direct connection (`db.xxx.supabase.co`) sering hanya IPv6. Solusi:

1. **Gunakan SQL Editor** di Supabase Dashboard (cara termudah), atau
2. **Gunakan Session pooler** connection string dengan `npm run db:push:url`

### Register/login gagal

- Pastikan migrasi database sudah dijalankan
- Cek **Site URL** dan **Redirect URLs** di Supabase Auth
- Pastikan `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` benar

### OAuth redirect error

- Pastikan redirect URI di provider **exact match** dengan URL di app
- Pastikan `NEXT_PUBLIC_APP_URL` sesuai port/domain yang dipakai

### Sync tidak menampilkan file

- Klik **Sync All** di halaman `/quota` setelah connect account
- Cek status account (harus `active`, bukan `error`)
- Pastikan OAuth scopes sudah benar per provider

---

## Referensi

- Spesifikasi fitur lengkap: [`README-OmniCloud.md`](README-OmniCloud.md)
- Supabase docs: [https://supabase.com/docs](https://supabase.com/docs)
- Next.js docs: [https://nextjs.org/docs](https://nextjs.org/docs)
