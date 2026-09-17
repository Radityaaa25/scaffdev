# 01 — Struktur Monorepo

## Tooling
Turborepo (dipilih karena native untuk ekosistem Next.js/Vercel, caching build cepat, gratis, dan tim sudah familiar Next.js).

## Struktur Folder Lengkap

```
scaff/                             (root monorepo)
├── apps/
│   └── web/                       → Aplikasi Next.js utama (landing, builder UI, admin panel, API routes)
│       ├── app/
│       │   ├── (marketing)/       → halaman landing/marketing publik
│       │   ├── builder/           → halaman pilih template (kategori, framework, preview, opsi)
│       │   ├── admin/             → halaman admin panel (CRUD template)
│       │   └── api/               → API routes (lihat 04-api-backend-architecture.md)
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
npm install          # install semua dependency di seluruh monorepo
npx turbo dev         # jalankan dev server semua apps yang punya script "dev"
npx turbo build        # build semua apps/packages sesuai dependency graph
npx turbo lint         # jalankan lint di semua package
```

## Kapan Menambah Package Baru
Jika ada fitur besar yang perlu dipisah (misal `packages/email` untuk notifikasi email), buat folder baru di `packages/`, ikuti pola `package.json` yang sama seperti `packages/ui`, dan daftarkan sebagai dependency di `apps/web/package.json` menggunakan workspace protocol (`"@repo/nama-package": "workspace:*"`).

## Referensi Silang
- Detail isi `apps/web`: lihat `05-web-frontend-architecture.md` dan `06-admin-panel-architecture.md`
- Detail isi `packages/cli`: lihat `02-cli-architecture.md`
- Detail isi `packages/database` (skema): lihat `03-database-architecture.md`
