# Dropbox — Setup Lengkap

Panduan mengatur Dropbox OAuth di TurnixCloud, mulai dari membuat app di Dropbox App Console sampai file Dropbox tampil di **My Drive**.

> Untuk development lokal, app Dropbox default-nya hanya bisa dipakai oleh **pemilik app**. Untuk user lain, aktifkan **Development users** (lihat [Development vs Production](#development-vs-production)).

---

## Ringkasan alur

TurnixCloud punya **tiga langkah terpisah** untuk Dropbox:

| Langkah | Arti | Indikator sukses |
|---|---|---|
| **Configure** | Simpan App key & App secret OAuth app Anda | Badge **Configured** di `/quota` |
| **Connect** | Authorize akun Dropbox pribadi pengguna | Muncul di **Connected Accounts** |
| **Sync** | Mirror metadata file ke database TurnixCloud | File tampil di **My Drive** |

Badge **Configured** saja **belum** menampilkan file Dropbox.

### Configure vs Connect

| Langkah | Apa yang diset | Berapa kali |
|---|---|---|
| **Langkah 1 — Configure** | OAuth **app** TurnixCloud (App key + App secret) | **1×** per provider |
| **Langkah 2 — Connect** | Akun Dropbox **pribadi** pengguna | **Banyak×** (akun berbeda) |

Satu App key/App secret Dropbox dipakai untuk semua akun Dropbox yang di-connect.

---

## Prasyarat

- TurnixCloud sudah jalan (lokal atau production HTTPS)
- Akun Dropbox (gratis atau Business)
- Variabel dasar sudah diset di `.env.local` atau hosting:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3500
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
TURNIX_SECRET_KEY=ganti-dengan-secret-minimal-32-karakter
```

| Variable | Fungsi |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Base URL app — dipakai untuk OAuth redirect URI |
| `TURNIX_SECRET_KEY` | Enkripsi token provider di database |

---

## Langkah 1 — Buat app di Dropbox App Console

### 1.1 Buka App Console

1. Login ke [Dropbox App Console](https://www.dropbox.com/developers/apps)
2. Klik **Create app**

### 1.2 Pilih tipe app

| Opsi | Rekomendasi |
|---|---|
| **Choose an API** | **Scoped access** (wajib untuk app baru) |
| **Choose the type of access** | **Full Dropbox** — akses seluruh file user (cocok untuk file manager) |
| | **App folder** — hanya folder khusus `/Apps/<nama-app>/` |
| **Name your app** | Mis. `TurnixCloud` (harus unik di seluruh Dropbox) |

3. Centang syarat & ketentuan → **Create app**

> **Full Dropbox** vs **App folder**: TurnixCloud memakai path penuh (`/`, folder mana saja). Pilih **Full Dropbox** kecuali Anda sengaja membatasi ke satu folder app.

### 1.3 Atur permissions (scope)

1. Buka tab **Permissions**
2. Aktifkan scope berikut (sesuai fitur TurnixCloud):

| Scope | Dipakai untuk |
|---|---|
| `account_info.read` | Info akun & quota (`users/get_current_account`, `users/get_space_usage`) |
| `files.metadata.read` | List & baca metadata folder/file |
| `files.metadata.write` | Buat folder, rename, move, delete |
| `files.content.read` | Download file |
| `files.content.write` | Upload file |

3. Klik **Submit** di bar bawah halaman

> **Penting:** Tanpa klik **Submit**, perubahan permission **tidak tersimpan**. Jika connect gagal dengan error scope, cek tab Permissions dan submit ulang.

### 1.4 Salin App key & App secret

1. Buka tab **Settings**
2. Di bagian **OAuth 2**, catat:
   - **App key** → ini **Client ID** TurnixCloud
   - **App secret** → klik **Show** → ini **Client Secret** TurnixCloud

> App secret bersifat rahasia — jangan commit ke git atau bagikan publik.

---

## Langkah 2 — Set Redirect URI

Redirect URI TurnixCloud mengikuti `NEXT_PUBLIC_APP_URL`:

```
{NEXT_PUBLIC_APP_URL}/api/accounts/dropbox/callback
```

Contoh development (port 3500):

```
http://localhost:3500/api/accounts/dropbox/callback
```

Contoh production:

```
https://domain-anda.com/api/accounts/dropbox/callback
```

### 2.1 Daftarkan di Dropbox

1. Tab **Settings** → bagian **OAuth 2**
2. **Redirect URIs** → paste URI di atas → **Add**
3. Pastikan URI **exact match** (protocol, domain, port, path)

> Dropbox mengizinkan `http://localhost` untuk development. Production **wajib HTTPS**.

### 2.2 Salin dari dashboard TurnixCloud (alternatif)

1. Login TurnixCloud → **Storage & Accounts** (`/quota`)
2. Expand **Dropbox** di **Configure Cloud Providers**
3. Copy **Redirect URI** yang ditampilkan → paste ke Dropbox App Console

---

## Langkah 3 — Configure di TurnixCloud

### 3.1 Lewat dashboard (disarankan)

1. Buka `/quota` → section **Configure Cloud Providers**
2. Expand **Dropbox**
3. Isi form:
   - **Enable provider**: ON
   - **Client ID**: paste **App key** dari Dropbox
   - **Client Secret**: paste **App secret** dari Dropbox
4. Klik **Save configuration**
5. Badge berubah menjadi **Configured**

### 3.2 Lewat `.env.local` (fallback)

Jika belum diset lewat dashboard, isi:

```env
DROPBOX_CLIENT_ID=app-key-dari-dropbox
DROPBOX_CLIENT_SECRET=app-secret-dari-dropbox
```

Dashboard config **mengoverride** env jika sudah disimpan di database.

---

## Langkah 4 — Connect akun Dropbox

1. Di `/quota`, klik **Add Account**
2. Pilih **Dropbox** → **Connect**
3. Login ke Dropbox (jika belum)
4. Klik **Allow** / **Continue**
5. Redirect kembali ke `/quota?connected=dropbox`
6. Di **Connected Accounts**, muncul entry Dropbox (email + quota bar)

### OAuth popup

TurnixCloud meminta **offline access** (`token_access_type=offline`) agar refresh token tersimpan — sync otomatis tetap jalan setelah access token expired.

---

## Langkah 5 — Sync & lihat file

1. Klik **Sync All** di section **Connected Accounts**
2. Tunggu toast **Sync completed**
3. Buka **My Drive** dari sidebar — file Dropbox tampil di explorer
4. (Opsional) Upload, rename, move, atau delete via TurnixCloud

---

## Development vs Production

| | **Development** | **Production** |
|---|---|---|
| Siapa bisa connect | Default: **hanya pemilik app** | Semua pengguna Dropbox |
| Batas user | +500 jika **Enable additional users** | Tidak dibatasi (setelah disetujui) |
| Redirect URI | `http://localhost:...` diperbolehkan | **HTTPS** wajib |
| Apply | Tidak perlu | **Apply for Production** di App Console |

### Development — izinkan user lain connect

1. Dropbox App Console → app Anda → tab **Settings**
2. Cari baris **Development users**
3. Klik **Enable additional users**
4. Maks. ~500 user development

Tanpa langkah ini, hanya akun Dropbox **pemilik app** yang bisa authorize.

### Production — Apply for Production

Untuk app live publik (banyak user, tanpa batas development):

1. Tab **Settings** → **Apply for production**
2. Isi form (platform: **Web**, deskripsi app, URL privacy policy jika diminta)
3. (Opsional) Tab **Branding** — isi publisher, deskripsi, icon
4. Tunggu persetujuan Dropbox

Setelah disetujui, update **Redirect URI** di Dropbox ke domain HTTPS production dan `NEXT_PUBLIC_APP_URL` di hosting.

---

## Deploy production (Vercel)

1. Set env vars di Vercel (sama seperti `.env.local`, plus `CRON_SECRET`)
2. `NEXT_PUBLIC_APP_URL=https://domain-anda.com`
3. Update Redirect URI di Dropbox App Console ke:
   ```
   https://domain-anda.com/api/accounts/dropbox/callback
   ```
4. Update Supabase Auth **Site URL** & **Redirect URLs** ke domain production
5. Redeploy

OAuth Dropbox bisa tetap dikonfigurasi lewat dashboard `/quota` tanpa redeploy (disimpan di Supabase).

---

## Diagram alur

```
Dropbox App Console              TurnixCloud Dashboard
─────────────────────            ─────────────────────
Create app (Scoped access)  →
Set Permissions + Submit    →
Copy App key & secret       →    Configure provider (Client ID/Secret)
Add Redirect URI            ←    Copy Redirect URI dari dashboard
Enable additional users     →    Add Account → Connect (OAuth login)
Apply for Production        →    Sync All
                                 My Drive ✓
```

---

## Troubleshooting

| Gejala | Penyebab umum | Solusi |
|---|---|---|
| Badge tidak **Configured** | Client ID/Secret kosong atau provider disabled | Isi form di `/quota`, pastikan **Enable** ON |
| `provider_not_configured` saat Connect | OAuth belum diset | Configure dulu (dashboard atau `.env.local`) |
| `invalid_state` / `oauth_denied` | Redirect URI salah atau user menolak | Cocokkan URI exact; coba Connect lagi |
| Error scope / `not permitted to access this endpoint` | Permission belum diset atau belum **Submit** | Tab **Permissions** → centang scope → **Submit** → Connect ulang |
| Hanya pemilik app yang bisa connect | Mode development default | **Enable additional users** di App Console |
| `This app has reached its user limit` | Batas development (~500) | **Apply for Production** |
| File kosong setelah connect | Belum sync | Klik **Sync All** di `/quota` |
| Redirect gagal di production | `NEXT_PUBLIC_APP_URL` masih localhost | Update env + Redirect URI Dropbox ke HTTPS |

### Cek Redirect URI

Pastikan ketiga nilai ini **identik**:

1. `NEXT_PUBLIC_APP_URL` + `/api/accounts/dropbox/callback`
2. Redirect URI di dashboard TurnixCloud (`/quota`)
3. Redirect URI di Dropbox App Console → **OAuth 2**

---

## Referensi

- [Dropbox App Console](https://www.dropbox.com/developers/apps)
- [Dropbox OAuth guide](https://developers.dropbox.com/oauth-guide)
- [Dropbox permission scopes](https://developers.dropbox.com/developers/reference/auth-types#scopes)
- TurnixCloud README — [Connect Google Drive](../README.md#connect-google-drive-step-by-step) (alur serupa)
- Panduan in-app: `/connect-guide` (sidebar **Help → Cara Connect**)
