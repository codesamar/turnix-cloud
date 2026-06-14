# Next.js Boilerplate Turnix

Boilerplate frontend dengan Next.js App Router, TypeScript, Tailwind CSS, dan komponen `shadcn/ui`.

## Tech Stack

- `next` 16 (App Router)
- `react` 18 + TypeScript
- `tailwindcss` + `tailwindcss-animate`
- `shadcn/ui` (Radix UI primitives)
- `framer-motion`, `react-hook-form`, `zod`, `recharts`

## Menjalankan Project (Local)

Prasyarat:
- Node.js 20+ (disarankan LTS)
- npm

Langkah:

```bash
npm install
npm run dev
```

App default berjalan di:
- [http://localhost:3000](http://localhost:3000)

Jika port sudah terpakai, jalankan:

```bash
npm run dev -- -p 3009
```

## Available Scripts

- `npm run dev` - Menjalankan development server.
- `npm run build` - Build production.
- `npm run start` - Menjalankan hasil build production.
- `npm run lint` - Menjalankan linting dengan Next.js ESLint.

## Menjalankan dengan Docker

Project sudah memiliki `Dockerfile` dan `docker-compose.yaml`.

```bash
docker compose up --build
```

Port mapping default:
- Host `3200` -> Container `3000`
- Akses di [http://localhost:3200](http://localhost:3200)

## Struktur Folder Singkat

- `app/` - Routing dan page App Router.
- `components/` - Komponen reusable, termasuk `components/ui` dari shadcn.
- `hooks/` - Custom React hooks.
- `lib/` - Utility/helper.

## Catatan Konfigurasi Next.js

- Gunakan file config `next.config.mjs`.
- `next.config.ts` tidak didukung pada setup ini.
