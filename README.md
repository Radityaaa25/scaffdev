<div align="center">

![Scaffdev](apps/web/public/logo-full.png#gh-dark-mode-only)
![Scaffdev](apps/web/public/logo-icon-bg-transparan.png#gh-light-mode-only)

**Scaffolding generator: starter kit Next.js & Laravel siap jalan dengan kurasi integrasi lokal Indonesia.**

[![npm version](https://img.shields.io/npm/v/scaffdev?style=flat-square&color=8B5CF6)](https://www.npmjs.com/package/scaffdev)
[![License: MIT](https://img.shields.io/badge/License-MIT-8B5CF6.svg?style=flat-square)](./docs/PRD-scaffolding-tool.md)
[![Next.js](https://img.shields.io/badge/Next.js-App_Router-black?style=flat-square&logo=next.js)](./apps/web)
[![Laravel](https://img.shields.io/badge/Laravel-PHP-FF2D20?style=flat-square&logo=laravel)](./docs/09-multi-framework-support.md)
[![Supabase](https://img.shields.io/badge/Supabase-Postgres-3ECF8E?style=flat-square&logo=supabase)](./docs/03-database-architecture.md)

[🚀 Mulai Cepat](#-mulai-cepat) •
[📦 Katalog Template](#-cara-pakai-untuk-user) •
[🛠️ Untuk Developer](#%EF%B8%8F-untuk-developer) •
[📚 Dokumentasi](#-dokumentasi) •
[🤝 Kontribusi](#-kontribusi)

</div>

---

## ✨ Apa itu Scaffdev?

Scaffdev membuatkan **project baru siap jalan dalam hitungan detik** — bukan folder kosong, melainkan starter kit lengkap: tampilan visual yang sudah jadi, struktur folder best-practice, `.env.example`, dan panduan setup `SETUP.md` yang digenerate otomatis.

```bash
npx scaffdev@latest --template=ecommerce-supabase-midtrans-nextjs
```

| | Katalog Template | Builder |
|---|---|---|
| Konsep | Bundel fix — langsung generate | Rancang-sendiri (base + centang integrasi) |
| Status | ✅ Live | 🔜 Coming Soon |

> **Catatan:** saat ini template tersedia untuk **Next.js** dan **Laravel**. Framework lain menyusul.

## 🚀 Mulai Cepat

**Untuk user (tanpa install apa pun):**

```bash
# Mode interaktif — pilih kategori → framework → varian
npx scaffdev@latest

# Langsung via slug
npx scaffdev@latest toko-saya --template=ecommerce-supabase-midtrans-nextjs

# Lalu, untuk Next.js:
cd toko-saya && npm install && cp .env.example .env.local && npm run dev
```

**Prasyarat:** Node.js v18+ • Git • koneksi internet • (Laravel: PHP 8.2+ & Composer)

## 🏗️ Struktur Monorepo

```
scaffdev/
├── apps/
│   ├── web/          → Katalog + docs + API (Next.js, :3000)
│   └── admin/        → Panel admin: template, integrasi, laporan (Next.js, :3001)
├── packages/
│   ├── cli/          → Scaffdev CLI (npm: scaffdev)
│   ├── database/     → Tipe shared + schema.sql (Supabase/Postgres)
│   ├── config/       → Konfigurasi shared
│   └── ui/           → Design system shared
├── docs/             → Arsitektur & panduan (00–19 + PRD)
└── turbo.json        → Pipeline Turborepo (pnpm workspace)
```

## 🛠️ Untuk Developer

```bash
# Install semua dependency (sekali saja, dari root)
pnpm install

# Jalankan web + admin bersamaan
pnpm dev

# Build / lint / typecheck semua package
pnpm build
pnpm lint
pnpm typecheck
```

**Environment yang dibutuhkan** (lihat `apps/web/.env.example` & `apps/admin/.env.example`):

| Variable | Dipakai |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Web + admin (database & auth) |
| `NEXT_PUBLIC_API_BASE_URL` | Admin → API web |
| `GROQ_API_KEY` | Asisten AI (opsional) |
| `CORS_ALLOWED_ORIGINS` | Production web (opsional) |

**Migrasi database** (`packages/database/schema.sql`, idempotent — aman di-run ulang di Supabase SQL Editor):

| Migrasi | Isi |
|---|---|
| 001 | Statistik downloads + RPC counter |
| 002 | Log aktivitas + helper manajemen admin |
| 003 | Riwayat chat AI admin (retensi 30 hari) |
| 004 | Log pemakaian AI |
| 005 | Bucket Storage `template-screenshots` |
| 006 | Tabel `frameworks` & `kategoris` + seed |
| 007–008 | Tabel `laporan` + kolom gambar + policy upload publik |

**Publish CLI baru** (`packages/cli` → npm `scaffdev`):

```bash
cd packages/cli
pnpm build
npm publish --access public   # butuh OTP authenticator
```

## ✨ Fitur Utama

- 🎨 **Katalog visual** — filter kategori/framework/integrasi, search, sort, pagination, preview screenshot
- 🤖 **Asisten AI** — publik (docs + katalog aware, anti-prompt-injection) & admin (live DB aware)
- 🧩 **Integrasi lokal** — Supabase, Midtrans, Xendit, Duitku (+ framework & kategori terkelola admin)
- 📝 **Generate dokumen otomatis** — `.env.example` + `SETUP.md` sesuai template terpilih
- 📣 **Laporan pengguna** — form publik `/lapor` (termasuk upload bukti gambar tervalidasi) + tindak lanjut admin
- 🔍 **SEO + AI-search ready** — sitemap dinamis, JSON-LD, `llms.txt`/`llms-full.txt`, metadata per halaman
- 🔒 **Keamanan berlapis** — RLS Supabase, validasi server-side, rate limiting, security headers

## 📚 Dokumentasi

| Dokumen | Isi |
|---|---|
| [`docs/00-overview.md`](./docs/00-overview.md) | Gambaran besar proyek |
| [`docs/01-monorepo-structure.md`](./docs/01-monorepo-structure.md) | Struktur monorepo & workspace |
| [`docs/02-cli-architecture.md`](./docs/02-cli-architecture.md) | Arsitektur CLI |
| [`docs/03-database-architecture.md`](./docs/03-database-architecture.md) | Skema database & RLS |
| [`docs/07-template-slug-system.md`](./docs/07-template-slug-system.md) | Sistem slug (prinsip: CLI tanpa hardcode) |
| [`docs/11-npm-publishing-guide.md`](./docs/11-npm-publishing-guide.md) | Cara publish CLI |
| [`docs/15-security-guidelines.md`](./docs/15-security-guidelines.md) | Panduan keamanan |
| [`REMINDER.md`](./REMINDER.md) | ⚠️ Checklist wajib sebelum production |

Dokumentasi user (yang tampil di web): [`apps/web/content/docs/`](./apps/web/content/docs/)

## 🤝 Kontribusi

1. Fork repo ini → buat branch → commit → buka Pull Request ke `main`.
2. Untuk template baru, baca [Panduan Kontribusi Template](./apps/web/content/docs/cara-kontribusi-template.md).
3. Butuh bantuan atau ingin bekerjasama? Hubungi kami: [scaffdev.support@gmail.com](mailto:scaffdev.support@gmail.com) — atau [laporkan bug](https://scaffdev.vercel.app/lapor).

---

<div align="center">

**Scaffdev** — ship project hari ini, bukan minggu depan. 🚀

MIT License • Open-source untuk developer Indonesia 🇮🇩

</div>
