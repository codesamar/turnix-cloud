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

Migrasi schema ada di folder [`supabase/migrations/`](supabase/migrations/).

#### Cara A — SQL Editor (disarankan)

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Copy seluruh isi file `supabase/migrations/001_initial.sql` → **Run**
3. Ulangi untuk `supabase/migrations/002_provider_config.sql` → **Run**

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
- `provider_config` (dari migrasi `002`)

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

> Untuk development, nonaktifkan **Confirm email** di **Authentication → Providers → Email** agar user bisa langsung login setelah register.

---

## Connect Google Drive (Step-by-Step)

TurnixCloud punya **dua langkah terpisah** untuk Google Drive:

| Langkah | Arti | Di dashboard |
|---|---|---|
| **Configure** | Simpan OAuth Client ID & Secret app Anda | Badge **Configured** |
| **Connect** | Authorize akun Google Drive pribadi | Muncul di **Connected Accounts** |
| **Sync** | Mirror metadata file ke database | File tampil di **My Drive** |

Badge **Configured** saja **belum** menampilkan file Drive.

> Panduan interaktif juga tersedia di dashboard: sidebar **Help → How to Connect** (`/connect-guide`).

---

### Bagian A — Setup Google Cloud Console

#### A1. Buat project & enable API

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. Buat project baru (mis. `TurnixCloud`)
3. **APIs & Services → Library** → cari **Google Drive API** → **Enable**

#### A2. Setup Google Auth platform (OAuth consent)

1. Menu kiri → **Google Auth platform**  
   (alternatif: **APIs & Services → OAuth consent screen**)
2. Jika belum pernah setup, klik **Get Started** dan isi:
   - **App name**: `TurnixCloud`
   - **User support email**: email Anda
   - **Audience**: **External**
   - **Contact email**: email Anda
3. Klik **Create**

#### A3. Tambah Test users (wajib untuk mode Testing)

> Mode **Production** (tanpa Test users): lihat [docs/google-oauth-production.md](docs/google-oauth-production.md)

1. Buka tab **Audience** di **Google Auth platform**
   Link langsung: `https://console.cloud.google.com/auth/audience`
2. Pastikan **Publishing status** = **Testing**
3. Scroll ke **Test users** → **Add users**
4. Tambahkan email Google yang dipakai untuk connect (mis. `you@gmail.com`)
5. **Save**

> Tanpa test user, Google akan menolak dengan **Error 403: access_denied**.

#### A4. Buat OAuth Client ID

1. **Google Auth platform → Clients** (atau **APIs & Services → Credentials**)
2. **+ Create Credentials → OAuth client ID**
3. Application type: **Web application**
4. **Authorized redirect URIs** → tambahkan (sesuai `NEXT_PUBLIC_APP_URL`):

   ```
   http://localhost:3500/api/accounts/google_drive/callback
   ```

   Ganti `3500` dengan port Anda. Production: `https://domain-anda.com/api/accounts/google_drive/callback`

5. **Create** → copy **Client ID** dan **Client Secret**

> Client Secret hanya ditampilkan **sekali** saat create. Jika terlewat: buka client → **Reset secret**.

---

### Bagian B — Konfigurasi di Dashboard TurnixCloud

1. Login ke TurnixCloud
2. Buka **Storage & Accounts** (`/quota`) dari sidebar
3. Section **Configure Cloud Providers** → expand **Google Drive**
4. Isi form:
   - **Enable provider**: ON
   - **Client ID**: paste dari Google Cloud
   - **Client Secret**: paste dari Google Cloud
5. Copy **Redirect URI** yang ditampilkan → paste ke Google Console (harus **exact match**)
6. Klik **Save configuration**
7. Badge berubah menjadi **Configured**

Alternatif: isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di `.env.local` (fallback jika belum set lewat dashboard).

---

### Bagian C — Connect akun Google Drive

1. Di halaman `/quota`, klik tombol **Add Account**
2. Pilih **Google Drive** → klik **Connect**
3. Login dengan akun Google (harus ada di **Test users**)
4. Klik **Allow** / **Continue**
5. Redirect kembali ke `/quota?connected=google_drive`
6. Di **Connected Accounts**, muncul entry Google Drive (email + quota bar)

---

### Bagian D — Sync & lihat file

1. Klik **Sync All** di section **Connected Accounts**
2. Tunggu toast **Sync completed**
3. Buka **My Drive** dari sidebar — file Google Drive tampil di explorer
4. (Opsional) Upload file via drag-and-drop di **My Drive**

---

### Diagram alur Google Drive

```
Google Cloud Console          TurnixCloud Dashboard
─────────────────────         ─────────────────────
Enable Drive API      →
Setup Auth platform   →
Add Test users        →
Create OAuth Client   →       Configure provider (Client ID/Secret)
                              Add Account → Connect (OAuth login)
                              Sync All
                              My Drive ✓
```

---

### 6. Provider cloud lainnya (opsional)

Selain Google Drive, provider OAuth lain bisa dikonfigurasi lewat dashboard (`/quota → Configure Cloud Providers`) atau `.env.local`.

#### OneDrive

1. [Azure App Registration](https://portal.azure.com/) → New registration
2. Redirect URI (Web) — copy dari dashboard TurnixCloud saat expand **OneDrive**:
   ```
   {NEXT_PUBLIC_APP_URL}/api/accounts/onedrive/callback
   ```
3. API permissions: `Files.ReadWrite.All`, `User.Read`, `offline_access`
4. Simpan di dashboard: Client ID, Client Secret, Tenant ID (`common`)

#### Dropbox

> Panduan lengkap: [docs/dropbox-setup.md](docs/dropbox-setup.md)

1. [Dropbox App Console](https://www.dropbox.com/developers/apps) → Create app (**Scoped access**)
2. Tab **Permissions** → aktifkan `account_info.read`, `files.metadata.read/write`, `files.content.read/write` → **Submit**
3. Tab **Settings** → copy **App key** & **App secret**; tambah Redirect URI:
   ```
   {NEXT_PUBLIC_APP_URL}/api/accounts/dropbox/callback
   ```
4. Simpan di dashboard `/quota`: Client ID (= App key), Client Secret (= App secret)
5. **Add Account → Connect** → **Sync All**

#### Yandex Disk

1. [Yandex OAuth](https://oauth.yandex.com/) → buat aplikasi
2. Redirect URI dari dashboard TurnixCloud
3. Simpan Client ID & Secret di dashboard

#### S3 Compatible

Tidak perlu OAuth app config. Connect langsung via **Add Account → Connect** → isi endpoint, bucket, access key.

> Ganti `{NEXT_PUBLIC_APP_URL}` dengan URL app Anda (mis. `http://localhost:3500`).

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

1. Buka app → **Register** akun baru (atau **Login**)
2. Buka **Storage & Accounts** (`/quota`)
3. Ikuti section [Connect Google Drive](#connect-google-drive-step-by-step) di atas
4. Klik **Sync All** → buka **My Drive**
5. Upload file via drag-and-drop di **My Drive**

---

## Deploy ke Production (Vercel + Supabase)

> **Google Drive OAuth production** (connect tanpa Test users): lihat [docs/google-oauth-production.md](docs/google-oauth-production.md)  
> **Dropbox setup lengkap**: lihat [docs/dropbox-setup.md](docs/dropbox-setup.md)

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

- Pastikan redirect URI di provider **exact match** dengan **Redirect URI** di dashboard TurnixCloud
- Pastikan `NEXT_PUBLIC_APP_URL` sesuai port/domain yang dipakai (termasuk `http` vs `https`)

### Google OAuth: Error 403 access_denied

- App masih **Testing** → tambahkan email di **Google Auth platform → Audience → Test users**
- Setiap Gmail baru perlu ditambah sendiri saat masih Testing
- Email connect harus **sama persis** dengan yang ada di test users list
- Token test user expire **7 hari** → connect ulang jika sudah lewat
- **Production:** publish app + App Verification — lihat [docs/google-oauth-production.md](docs/google-oauth-production.md)

### Google Drive "Configured" tapi file tidak tampil

- **Configured ≠ Connected** — klik **Add Account → Connect** setelah save config
- Setelah connect, klik **Sync All**
- Cek **Connected Accounts**: status harus `active`, bukan `error`

### Client Secret tidak muncul di Google Console

- Secret hanya ditampilkan sekali saat create OAuth client
- Buka client di **Google Auth platform → Clients** → **Reset secret** → copy secret baru → update di dashboard TurnixCloud

### Sync tidak menampilkan file

- Klik **Sync All** di halaman `/quota` setelah connect account
- Cek status account (harus `active`, bukan `error`)
- Pastikan OAuth scopes sudah benar per provider

---

## Referensi

- Spesifikasi fitur lengkap: [`README-OmniCloud.md`](README-OmniCloud.md)
- Supabase docs: [https://supabase.com/docs](https://supabase.com/docs)
- Next.js docs: [https://nextjs.org/docs](https://nextjs.org/docs)
