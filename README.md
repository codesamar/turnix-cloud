# SamarCloud

<p align="center">
  <img src="public/logo/samar-cloud-logo-only-no-bg.png" alt="SamarCloud mark" width="120" />
  <br />
  <img src="public/logo/samar-cloud-logo-text-no-bg.png" alt="SamarCloud" width="280" />
</p>

[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/) [![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/) [![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/) [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/) [![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/) [![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://vercel.com/)

SamarCloud is a cloud drive aggregation platform that presents multiple storage providers through a single, consistent workspace. Built with **Next.js 16** and **Supabase** (Auth, Postgres, RLS, Realtime), it lets users browse, upload, download, and manage files across connected cloud accounts from one interface.

Brand assets live in [`public/logo/`](public/logo/) and are used app-wide via `SamarLogo` (sidebar, auth, favicon, OAuth popup, Open Graph).

![SamarCloud Overview](image.png)

## ✨ Key features

### ☁️ Multi-provider cloud aggregation
- Connect multiple cloud storage accounts in one application
- All providers are normalized through a consistent adapter layer
- Active support includes OAuth, session-token, and access-key connections
- Provider OAuth credentials can be configured per deployment via the dashboard or environment variables

### 🗂️ Unified file workspace
- `Home`, `My Drive`, `Recent`, `Starred`, `Shared with Me`, and `Quota` views
- Virtual-path-based file navigation across providers
- File metadata is presented consistently across different provider sources

### 📁 File management
- Browse files and folders from connected accounts
- Create folders, rename, delete (including bulk delete)
- Download provider files
- View file details and previews for supported file types
- Star / unstar files on providers that support it

### ⬆️ Upload system
- Browser-based drag-and-drop uploads
- Folder upload support
- Upload destination selection via the allocation service
- Automatic account allocation based on storage selection strategy

### 🔄 Sync and metadata mirror
- File metadata is stored in Supabase Postgres for fast navigation
- Manual sync trigger from the dashboard (`Sync All`)

### 👤 Auth and multi-user
- Supabase Auth with email register / login
- Account data, file mirrors, allocation config, and settings scoped per user (RLS)

### ⚙️ User settings and storage allocation
- Language and theme settings
- Storage allocation strategies:
  - `round_robin`
  - `weighted_round_robin`
  - `least_used`
  - `most_free`
  - `manual`
- Account priority order can be configured for the manual strategy

## ☁️ Supported providers

| Provider | Status | Integration model |
| --- | --- | --- |
| Google Drive | Active | OAuth + Google Drive API |
| OneDrive | Active | OAuth + Microsoft Graph |
| Dropbox | Active | OAuth + Dropbox API |
| Yandex Disk | Active | OAuth + Yandex Disk API |
| TeraBox | Active | NDUS session token |
| S3-compatible storage | Active | Access key / secret key / endpoint |
| MEGA | Stub | Not yet implemented |
| pCloud | Stub | Not yet implemented |

> Detailed provider setup guides:
> - [Google OAuth (production)](docs/google-oauth-production.md)
> - [Dropbox setup](docs/dropbox-setup.md)
> - [TeraBox setup](docs/terabox-setup.md)
> - Interactive guide in-app: **Help → How to Connect** (`/connect-guide`)

## 🏗️ Project structure

```text
samar-cloud/
├─ app/
│  ├─ (auth)/            # Login & register
│  ├─ (dashboard)/       # Home, My Drive, Recent, Starred, Quota, Settings
│  ├─ api/               # REST API route handlers
│  └─ oauth/             # OAuth completion page
├─ components/
│  ├─ ui/                # shadcn/ui components
│  ├─ files/             # File explorer, upload
│  ├─ accounts/          # Connect cloud accounts
│  ├─ providers/         # Provider configuration UI
│  └─ settings/          # User & allocation settings
├─ lib/
│  ├─ adapters/          # Cloud provider adapters
│  ├─ services/          # Sync, upload, allocation, crypto
│  ├─ supabase/          # Supabase client helpers
│  └─ i18n/              # English / Indonesian dictionaries
├─ supabase/migrations/  # Database schema SQL
├─ docs/                 # Provider setup documentation
├─ docker-compose.yaml
└─ README.md
```

## 🔄 How SamarCloud works

```mermaid
flowchart TD
    U[User] --> F[Next.js App<br/>App Router + React]
    F -->|Route handlers / REST| API[API Routes<br/>app/api]

    subgraph App Features
        F1[Auth]
        F2[Accounts]
        F3[File Explorer]
        F4[Uploads]
        F5[Settings]
        F6[Allocation]
    end

    F --> F1
    F --> F2
    F --> F3
    F --> F4
    F --> F5
    F --> F6

    API --> A[Adapter Registry]
    A --> G[Google Drive]
    A --> O[OneDrive]
    A --> D[Dropbox]
    A --> Y[Yandex]
    A --> T[TeraBox]
    A --> S[S3]

    G --> CP[Cloud Providers]
    O --> CP
    D --> CP
    Y --> CP
    T --> CP
    S --> CP

    API --> N[Normalized Samar Data Model]
    CP --> N

    N --> DB[(Supabase Postgres<br/>Metadata Mirror)]
    API --> DB
    F1 --> SA[Supabase Auth]
    SA --> DB

    API --> SY[Sync Service]
    SY --> CP
    SY --> DB

    API --> AL[Allocation Service]
    AL --> ACC[Target Account Selection<br/>round_robin / weighted / least_used / most_free / manual]
    ACC --> CP
```

At a high level:

1. The Next.js app calls API route handlers for auth, accounts, files, uploads, settings, and allocation
2. The API selects the appropriate provider adapter (`google_drive`, `onedrive`, `dropbox`, `yandex`, `terabox`, `s3`)
3. Provider responses are normalized into the Samar data model
4. File metadata is mirrored into Supabase Postgres for fast access
5. The sync service keeps mirrored metadata aligned with provider state (manual sync from the dashboard)

## 🧩 Current application views

- `/` → Home dashboard
- `/my-drive` → main file explorer
- `/shared-with-me` → shared files from supported providers
- `/recent` → recent files
- `/starred` → starred files
- `/quota` → quota overview, account management, provider config, allocation
- `/settings` → user settings
- `/connect-guide` → interactive provider connect guide
- `/login` and `/register` → authentication

## 📋 Requirements

- Node.js 20+ (LTS recommended)
- npm
- A [Supabase](https://supabase.com) project
- Provider credentials for the cloud services you want to use

## 🛠️ Local setup

### 1. Clone and install

```bash
git clone <repo-url> samar-cloud
cd samar-cloud
npm install
```

### 2. Create a Supabase project

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → **New project**
2. From **Project Settings → API**, copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (server only)

### 3. Run database migrations

Migrations live in [`supabase/migrations/`](supabase/migrations/).

**Option A — SQL Editor (recommended)**

1. Supabase Dashboard → **SQL Editor** → **New query**
2. Run in order:
   - `001_initial.sql`
   - `002_provider_config.sql`
   - `003_terabox_provider.sql`

**Option B — Supabase CLI**

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
npm run db:push
```

If direct connection fails (e.g. IPv6), use the Session pooler connection string:

```bash
npm run db:push:url "postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

Expected tables: `profiles`, `cloud_accounts`, `file_metadata`, `upload_sessions`, `allocation_config`, `provider_config`.

### 4. Environment variables

```bash
cp .env.example .env.local
```

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
SAMAR_SECRET_KEY=replace-with-a-strong-random-secret-at-least-32-chars

# Optional OAuth fallbacks (can also be set in dashboard → /quota)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
ONEDRIVE_CLIENT_ID=
ONEDRIVE_CLIENT_SECRET=
ONEDRIVE_TENANT_ID=common
DROPBOX_CLIENT_ID=
DROPBOX_CLIENT_SECRET=
YANDEX_CLIENT_ID=
YANDEX_CLIENT_SECRET=
```

Generate secrets:

```bash
openssl rand -base64 32
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key (safe in browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server only) |
| `NEXT_PUBLIC_APP_URL` | App URL used for OAuth redirects |
| `SAMAR_SECRET_KEY` | Encrypts provider tokens at rest (min. 32 chars) |

Notes:
- TeraBox and S3 do not use `.env` OAuth credentials; they are connected from the UI
- Dashboard provider config on `/quota` takes precedence over env fallbacks for OAuth apps
- Never leave `SAMAR_SECRET_KEY` as the placeholder from `.env.example` — generate a real secret with `openssl rand -base64 32`
- Changing `SAMAR_SECRET_KEY` without re-encrypting existing DB rows breaks decrypt (accounts stay in DB, but sync / OAuth config fail). See [Rotate `SAMAR_SECRET_KEY`](#-rotate-samar_secret_key)

### 5. Configure Supabase Auth

In **Authentication → URL Configuration**:

| Setting | Local | Production |
| --- | --- | --- |
| **Site URL** | `http://localhost:3000` | `https://your-domain.com` |
| **Redirect URLs** | `http://localhost:3000/auth/callback` | `https://your-domain.com/auth/callback` |

Enable email signup. For local development, disable **Confirm email** so you can log in immediately after register.

### 6. Connect a provider (example: Google Drive)

SamarCloud separates **Configure** (OAuth app credentials) from **Connect** (authorize a personal account):

1. Create a Google Cloud OAuth Web client; enable Google Drive API
2. Redirect URI must match exactly, e.g. `http://localhost:3000/api/accounts/google_drive/callback`
3. In SamarCloud → `/quota` → **Configure Cloud Providers** → save Client ID / Secret
4. **Add Account → Connect** → authorize → **Sync All** → open **My Drive**

For Testing-mode Google apps, add your Gmail under **Google Auth platform → Audience → Test users**, or see [docs/google-oauth-production.md](docs/google-oauth-production.md).

## 💻 Development

```bash
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

If the port is taken:

```bash
npm run dev -- -p 3500
```

Keep `NEXT_PUBLIC_APP_URL` in sync with the port you use.

### First-run checklist

1. Register / login
2. Open **Storage & Accounts** (`/quota`)
3. Configure + connect at least one provider
4. **Sync All** → open **My Drive**
5. Upload via drag-and-drop

## 🐳 Docker setup

```bash
docker compose up --build
```

- Host port `3200` → container `3000`
- Open [http://localhost:3200](http://localhost:3200)
- Point `NEXT_PUBLIC_APP_URL` (and OAuth redirect URIs) at the URL you actually use

Stop:

```bash
docker compose down
```

## 🚀 Deploy (Vercel + Supabase)

1. Push the repo to GitHub and import it in [Vercel](https://vercel.com)
2. Set all env vars from `.env.local`
3. Set `NEXT_PUBLIC_APP_URL` to the production domain
4. Deploy

Also update:
- Supabase Auth Site URL / Redirect URLs to production
- OAuth redirect URIs on each provider console to the production domain
- Use the **same** `SAMAR_SECRET_KEY` as the environment that encrypted the data in Supabase (or run the [rotation script](#-rotate-samar_secret_key) first)

## 🔑 Rotate `SAMAR_SECRET_KEY`

`SAMAR_SECRET_KEY` encrypts:

- Linked account tokens in `cloud_accounts.credentials_encrypted`
- OAuth client secrets in `provider_config.client_secret_encrypted`

If you change the key (for example you left the placeholder and later set a real secret), **re-encrypt existing rows** before relying on the new key in local or production.

```bash
# Preview (no DB writes)
OLD_SAMAR_SECRET_KEY='previous-secret' \
NEW_SAMAR_SECRET_KEY='new-secret' \
npm run secrets:reencrypt -- --dry-run

# Apply
OLD_SAMAR_SECRET_KEY='previous-secret' \
NEW_SAMAR_SECRET_KEY='new-secret' \
npm run secrets:reencrypt
```

Notes:
- Script reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from `.env.local` when unset
- If `NEW_SAMAR_SECRET_KEY` is omitted, it uses `SAMAR_SECRET_KEY` from `.env.local`
- Rows already encrypted with the new key are skipped; rows that decrypt with neither key are reported as failed
- After a successful run: set the **new** key in `.env.local` **and** Vercel (or your host), then redeploy
- Keep local and production on the same key if they share one Supabase project
- Alternative without the script: re-save each provider Client Secret in `/quota` Step 1, then **Reconnect** every linked account (tokens cannot be recovered without the old key)

## 📌 Available scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Next.js development server |
| `npm run build` | Production build |
| `npm run start` | Run production build |
| `npm run lint` | ESLint |
| `npm run supabase` | Supabase CLI (via local dependency) |
| `npm run db:push` | Push migrations to linked Supabase project |
| `npm run db:push:url` | Push migrations with an explicit DB URL |
| `npm run secrets:reencrypt` | Re-encrypt DB secrets after rotating `SAMAR_SECRET_KEY` |

## 🔌 API overview

### Health and sync
- `GET /api/health`
- `POST /api/sync/run`

### Authentication
- `GET /api/auth/me`

### Accounts
- `GET /api/accounts`
- `POST /api/accounts/connect`
- `GET /api/accounts/[provider]/connect`
- `GET /api/accounts/[provider]/callback`
- `POST /api/accounts/terabox/connect`

### Providers
- `GET /api/providers`
- `GET|PUT /api/providers/[provider]`

### Files
- `GET /api/files`
- `GET|PATCH|DELETE /api/files/[id]`
- `GET /api/files/[id]/download`
- `GET /api/files/[id]/preview`

### Uploads
- `POST /api/uploads`
- `GET /api/uploads/destination`

### Settings and allocation
- `GET|PATCH /api/settings`
- `GET|PATCH /api/allocation`

## 🧠 Storage allocation behavior

When an upload starts, the allocation service selects the target account based on the user's configuration. This only affects **new uploads**; sync, browse, and preview still use each file's original account.

Example use cases:
- Rotate uploads across accounts (`round_robin`)
- Prefer the account with the most free space (`most_free`)
- Enforce a fixed priority list (`manual`)

## 🗄️ Data persistence

Important data stored in Supabase includes:

- Mirrored file metadata (`file_metadata`)
- Linked cloud accounts (`cloud_accounts`)
- Encrypted provider credentials / token material
- Per-provider OAuth app config (`provider_config`)
- User settings and allocation config
- Auth identities (Supabase Auth + `profiles`)

## 🔒 Security notes

- Do not commit `.env.local` or service-role keys
- Treat OAuth client secrets, refresh tokens, S3 keys, and TeraBox NDUS tokens as sensitive
- `SAMAR_SECRET_KEY` is used to encrypt provider credentials at rest — rotate via [`npm run secrets:reencrypt`](#-rotate-samar_secret_key), do not only change the env var
- `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to the browser
- Keep OAuth redirect URIs exact-match with `NEXT_PUBLIC_APP_URL`

## 🧯 Troubleshooting

### `supabase: command not found`
Use `npx supabase` or `npm run supabase -- --version`.

### Database push connection errors
Prefer the SQL Editor, or Session pooler URL with `npm run db:push:url`.

### Register / login fails
- Confirm migrations ran
- Check Supabase Auth Site URL / Redirect URLs
- Verify `NEXT_PUBLIC_SUPABASE_*` values

### OAuth redirect errors
Redirect URI in the provider console must **exact-match** the Redirect URI shown in `/quota`, and `NEXT_PUBLIC_APP_URL` must match the running origin.

### Google `403: access_denied`
App is still in Testing — add the Gmail under Test users, or publish for production ([guide](docs/google-oauth-production.md)).

### Provider shows "Configured" but no files
**Configured ≠ Connected.** Use **Add Account → Connect**, then **Sync All**.

### `provider_not_configured` / decrypt failures after changing `SAMAR_SECRET_KEY`
Existing ciphertext was encrypted with the previous key. Run [`npm run secrets:reencrypt`](#-rotate-samar_secret_key) with `OLD_SAMAR_SECRET_KEY` + `NEW_SAMAR_SECRET_KEY`, then set the new key everywhere and redeploy. If the old key is lost, re-save Client Secrets in `/quota` and reconnect accounts.

## 📄 Reference

- Feature parity reference (original OmniCloud): [`README-OmniCloud.md`](README-OmniCloud.md)
- Supabase docs: https://supabase.com/docs
- Next.js docs: https://nextjs.org/docs
