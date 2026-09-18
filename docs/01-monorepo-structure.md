# 01 — Struktur Monorepo

## Tooling
Turborepo (dipilih karena native untuk ekosistem Next.js/Vercel, caching build cepat, gratis, dan tim sudah familiar Next.js).

## Struktur Folder Lengkap

```
scaffdev/                          (root monorepo)
├── apps/
│   ├── web/                       → Aplikasi Next.js utama (landing, builder UI, katalog, API routes; port 3000)
│   │   ├── app/
│   │   │   ├── (marketing)/       → halaman landing/marketing publik
│   │   │   ├── builder/           → halaman pilih template (kategori, framework, preview, opsi)
│   │   │   └── api/               → API routes (lihat 04-api-backend-architecture.md)
│   │   ├── components/
│   │   ├── lib/
│   │   └── package.json
│   └── admin/                     → Admin panel terpisah (login, dashboard, CRUD template; port 3001)
│       ├── app/                   → login, dashboard bento, templates (list/new/edit)
│       ├── components/
│       ├── lib/
│       └── package.json
├── packages/
│   ├── ui/                        → shared component (shadcn/ui based), dipakai apps/web
│   ├── cli/                       → CLI package, INI YANG DI-PUBLISH KE NPM (lihat 02-cli-architecture.md)
│   ├── database/                  → shared schema/types Supabase, dipakai apps/web dan packages/cli (jika perlu tipe yang sama)
│   └── config/                    → shared ESLint config, TSConfig base
├── docs/                          → SEMUA file .md dokumentasi arsitektur (folder ini sendiri, DI LUAR build process)
├── package.json                   → root, berisi konfigurasi Turborepo
├── turbo.json                     → konfigurasi task Turborepo (build, dev, lint)
└── README.md                      → entry point, penjelasan singkat + link ke docs/
```

## Aturan Penting
- **`docs/` TIDAK ikut proses build apapun.** Folder ini murni dokumentasi, tidak di-import oleh kode apapun di `apps/` atau `packages/`.
- **`packages/cli` adalah unit independen.** Package ini punya `package.json` sendiri, versi sendiri, dan di-publish terpisah dari `apps/web`. Jangan taruh dependency yang hanya dibutuhkan web di dalam `packages/cli`, dan sebaliknya.
- **`packages/ui` hanya untuk komponen visual**, tidak boleh berisi logic bisnis (fetch data, dsb) — itu tempatnya di `apps/web/lib`.
- Setiap `package.json` di dalam `apps/*` dan `packages/*` WAJIB mendeklarasikan dependency-nya sendiri secara eksplisit (tidak mengandalkan hoisting implisit), supaya kalau ada AI agent/developer lain yang mengerjakan satu package secara terisolasi, semua kebutuhan tetap jelas dari file itu sendiri.

## Command Dasar (Root)
```bash
pnpm install           # install semua dependency di seluruh monorepo
pnpm dev               # jalankan dev server semua apps yang punya script "dev"
pnpm build             # build semua apps/packages sesuai dependency graph
pnpm lint              # jalankan lint di semua package
pnpm typecheck         # jalankan typecheck di semua package
```

> Catatan: package manager monorepo ini adalah **pnpm** (lihat `pnpm-workspace.yaml`
> dan field `packageManager` di root `package.json`). Command `npx scaffdev@latest`
> yang dilihat end-user TIDAK berubah — package CLI tetap di-publish ke npm registry,
> jadi user tetap install via `npx`/`npm` seperti biasa.

## Kapan Menambah Package Baru
Jika ada fitur besar yang perlu dipisah (misal `packages/email` untuk notifikasi email), buat folder baru di `packages/`, ikuti pola `package.json` yang sama seperti `packages/ui`, dan daftarkan sebagai dependency di `apps/web/package.json` menggunakan workspace protocol (`"@repo/nama-package": "workspace:*"`).

## Referensi Silang
- Detail isi `apps/web`: lihat `05-web-frontend-architecture.md`
- Detail isi `apps/admin`: lihat `06-admin-panel-architecture.md`
- Detail isi `packages/cli`: lihat `02-cli-architecture.md`
- Detail isi `packages/database` (skema): lihat `03-database-architecture.md`
