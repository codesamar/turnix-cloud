# Google OAuth — Production Setup

Panduan mengatur Google Drive OAuth agar **semua pengguna Google** bisa connect tanpa daftar **Test users** (mode Testing).

> Untuk development lokal, tetap gunakan mode **Testing** + Test users. Lihat [README.md — Connect Google Drive](../README.md#connect-google-drive-step-by-step).

---

## Testing vs Production

| | **Testing** (development) | **Production** |
|---|---|---|
| Siapa bisa connect | Hanya email di **Test users** | Semua pengguna Google |
| Batas user | Maks. ~100 test users | Tidak dibatasi test user |
| Verifikasi Google | Tidak wajib | **Wajib** untuk scope Drive |
| Token OAuth | Bisa expire ~7 hari | Refresh token lebih stabil |
| Cocok untuk | Dev, demo internal | App live untuk publik |

### Configure vs Connect (TurnixCloud)

| Langkah | Apa yang diset | Berapa kali |
|---|---|---|
| **Langkah 1 — Configure** | OAuth **app** TurnixCloud (Client ID + Secret) | **1×** per provider |
| **Langkah 2 — Connect** | Akun Gmail **pribadi** pengguna | **Banyak×** (email berbeda) |

Satu Client ID/Secret Google Drive dipakai untuk semua akun Gmail yang di-connect.

---

## Prasyarat

- TurnixCloud sudah deploy ke domain **HTTPS** (mis. Vercel)
- Google Cloud project dengan **Google Drive API** enabled
- OAuth client sudah pernah dibuat (Client ID + Secret)
- URL **Privacy Policy** publik (wajib untuk verifikasi Google)

---

## Langkah 1 — Deploy TurnixCloud

### 1.1 Environment variables (Vercel / hosting)

Set minimal variabel berikut:

```env
NEXT_PUBLIC_APP_URL=https://domain-anda.com
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
TURNIX_SECRET_KEY=ganti-dengan-secret-minimal-32-karakter
CRON_SECRET=secret-untuk-vercel-cron
```

| Variable | Fungsi |
|---|---|
| `NEXT_PUBLIC_APP_URL` | Base URL app — dipakai untuk OAuth redirect URI |
| `TURNIX_SECRET_KEY` | Enkripsi token provider di database |
| `CRON_SECRET` | Auth endpoint sync otomatis (`/api/sync/run`) |

OAuth Google bisa diset lewat **dashboard** (`/quota → Configure Cloud Providers`) atau fallback `.env`:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### 1.2 Supabase Auth URLs

Supabase Dashboard → **Authentication → URL Configuration**:

| Setting | Nilai |
|---|---|
| **Site URL** | `https://domain-anda.com` |
| **Redirect URLs** | `https://domain-anda.com/**` |

---

## Langkah 2 — Google Cloud Console

### 2.1 Redirect URI production

1. Buka [Google Cloud Console](https://console.cloud.google.com/)
2. **Google Auth platform → Clients** (atau **APIs & Services → Credentials**)
3. Buka OAuth client **Web application** TurnixCloud
4. **Authorized redirect URIs** → tambahkan:

```
https://domain-anda.com/api/accounts/google_drive/callback
```

Ganti `domain-anda.com` dengan domain production Anda.

> URI localhost bisa tetap ada untuk development:
> `http://localhost:3500/api/accounts/google_drive/callback`

**Redirect URI harus exact match** dengan URL yang ditampilkan di TurnixCloud dashboard (`/quota → Configure → Google Drive`).

### 2.2 Branding & kebijakan (wajib verifikasi)

Di **Google Auth platform**, lengkapi:

1. **Branding** — nama app, logo, domain homepage
2. **Audience** — **External** (bukan Internal workspace saja)
3. **Data Access / Scopes** — pastikan scope berikut terdaftar:
   - `https://www.googleapis.com/auth/drive`
   - `https://www.googleapis.com/auth/userinfo.email`

Siapkan URL publik:

- **Privacy Policy** (wajib)
- **Terms of Service** (disarankan)
- **Application homepage** (mis. `https://domain-anda.com`)

Scope `drive` termasuk **Restricted scope** — Google mensyaratkan **App Verification** sebelum penggunaan publik penuh.

### 2.3 Submit App Verification

1. Buka **Google Auth platform → Verification center**
2. Isi form verifikasi:
   - **App purpose**: unified cloud storage — pengguna connect Google Drive milik sendiri
   - **Scopes**: jelaskan mengapa butuh akses Drive penuh
   - **Privacy Policy URL**
   - **Demo video** (sering diminta): rekam alur register → configure → connect → sync → lihat file
3. **Submit** → tunggu review Google (beberapa hari hingga minggu)

Tanpa verifikasi yang disetujui, Google dapat menolak atau menampilkan peringatan *unverified app* untuk scope Drive.

### 2.4 Publish app (In Production)

Setelah branding lengkap (idealnya verifikasi disetujui):

1. **Google Auth platform → Audience**
2. **Publishing status** → klik **Publish app** / ubah ke **In production**
3. Konfirmasi publish

Setelah **In production**:

- **Test users tidak lagi wajib**
- Gmail mana pun bisa connect via TurnixCloud
- Untuk connect akun ke-2, ke-3, cukup **Tambah Akun → Tambah lagi** — tidak perlu tambah Test user

---

## Langkah 3 — Konfigurasi TurnixCloud (production)

1. Login ke `https://domain-anda.com`
2. Sidebar → **Penyimpanan & Akun** (`/quota`)
3. **Langkah 1 — Configure Cloud Providers** → expand **Google Drive**
4. Isi:
   - **Enable provider**: ON
   - **Client ID**: dari Google Console
   - **Client Secret**: dari Google Console
5. Copy **Redirect URI** dari form → pastikan sudah ada di Google Console (exact match)
6. **Simpan konfigurasi** → badge **Configured** / **Sudah dikonfigurasi**

### Langkah 4 — Connect & sync

1. **Langkah 2 — Tambah Akun** → **Google Drive** → **Hubungkan**
2. Login dengan Gmail (tanpa Test users)
3. **Allow access**
4. **Sinkron Semua** → buka **Drive Saya**

---

## Dev vs Production — dua OAuth client (disarankan)

| Environment | `NEXT_PUBLIC_APP_URL` | Redirect URI |
|---|---|---|
| Local | `http://localhost:3500` | `http://localhost:3500/api/accounts/google_drive/callback` |
| Production | `https://domain-anda.com` | `https://domain-anda.com/api/accounts/google_drive/callback` |

Opsi:

- **Satu OAuth client** — tambahkan kedua redirect URI di Google Console
- **Dua OAuth client** — terpisah dev/prod (lebih aman untuk production)

---

## Checklist production

```
[ ] Domain HTTPS live
[ ] NEXT_PUBLIC_APP_URL = https://domain-anda.com
[ ] TURNIX_SECRET_KEY diset di hosting
[ ] Supabase Site URL & Redirect URLs updated
[ ] Google Drive API enabled
[ ] Redirect URI production di Google Console
[ ] Redirect URI production match dengan dashboard TurnixCloud
[ ] Privacy Policy URL publik
[ ] App Verification submitted (scope Drive)
[ ] Publishing status = In production
[ ] Configure Client ID/Secret di dashboard production
[ ] Test connect dengan Gmail yang bukan Test user
[ ] Sync All → file muncul di My Drive
```

---

## Troubleshooting

### Error 403: access_denied

**Penyebab:** App masih **Testing** dan Gmail belum ada di Test users.

**Solusi development:** Tambah email ke **Audience → Test users** (setiap Gmail baru perlu ditambah sendiri).

**Solusi production:** Publish app ke **In production** + selesaikan **App Verification**.

### redirect_uri_mismatch

- Redirect URI di Google Console harus **exact match** dengan TurnixCloud dashboard
- Cek `http` vs `https`, port, trailing slash
- Cek `NEXT_PUBLIC_APP_URL` di env production

### "Configured" tapi tidak bisa connect

- **Configured** = Client ID/Secret tersimpan
- **Connected** = OAuth login sukses
- Pastikan Client Secret benar (reset di Google Console jika perlu)

### File tidak muncul setelah connect

1. Klik **Sinkron Semua** di `/quota`
2. Buka **Drive Saya**
3. Cek status akun = `active` (bukan `error`)

### Google hasn't verified this app

- Normal sebelum verifikasi disetujui
- Selesaikan **Verification center** di Google Auth platform
- Setelah approved, peringatan hilang untuk pengguna

---

## Diagram alur production

```
Deploy TurnixCloud (HTTPS)
        │
        ▼
Set NEXT_PUBLIC_APP_URL + Supabase URLs
        │
        ▼
Google Console: redirect URI production
        │
        ▼
Privacy Policy + Branding + Scopes
        │
        ▼
Submit App Verification (scope Drive)
        │
        ▼
Publish app → In production
        │
        ▼
TurnixCloud: Configure (Client ID/Secret)
        │
        ▼
Connect — semua Gmail tanpa Test users
        │
        ▼
Sync All → My Drive ✓
```

---

## Referensi

- [Google OAuth App Verification](https://support.google.com/cloud/answer/9110914)
- [Google Auth platform — Audience](https://console.cloud.google.com/auth/audience)
- [TurnixCloud README — Deploy](../README.md#deploy-ke-production-vercel--supabase)
- [TurnixCloud README — Connect Google Drive (dev)](../README.md#connect-google-drive-step-by-step)
- Panduan in-app: `/connect-guide` (sidebar **Help → Cara Connect**)
