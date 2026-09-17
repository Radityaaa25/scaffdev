# 07 — Template Slug System

## Kenapa File Ini Penting
Ini adalah konsep arsitektur PALING SERING DISALAHPAHAMI dalam proyek ini. Jika ada developer/AI agent baru yang bingung "bagaimana command tahu repo mana yang dimaksud", jawabannya HARUS merujuk ke file ini.

## Konsep Inti
**Command yang dilihat/diketik user TIDAK PERNAH menyebut URL GitHub secara langsung.** Command selalu menggunakan **slug** — kode pendek yang stabil (contoh: `ecommerce-basic-nextjs`) — sebagai parameter. Slug ini kemudian "diterjemahkan" menjadi URL repo yang sebenarnya oleh sistem backend, secara real-time, setiap kali CLI dijalankan.

Analogi: slug itu seperti "nomor plat" yang mudah diingat dan stabil, sedangkan URL GitHub adalah "alamat rumah sebenarnya" yang disimpan di "buku alamat" (database). CLI tidak pernah menghafal alamat — dia selalu bertanya ke buku alamat setiap kali dibutuhkan.

## Diagram Alur

```
┌─────────────┐     query slug      ┌──────────────┐
│  Web         │ ──────────────────> │   Database   │
│  (builder)   │ <────────────────── │  (Supabase)  │
└─────────────┘   dapat slug        └──────────────┘
      │
      │ tampilkan command ke user
      ▼
"npx scaffdev@latest --template=ecommerce-basic-nextjs"
      │
      │ user copy-paste ke terminal
      ▼
┌─────────────┐   npx download dari   ┌──────────────┐
│  Terminal    │ ────────────────────> │ npm registry │
│  user        │ <──────────────────── │ (CLI)        │
└─────────────┘   jalankan index.js   └──────────────┘
      │
      │ CLI baca slug dari argumen, panggil API
      ▼
┌─────────────┐   GET /api/templates/:slug   ┌──────────────┐
│  API         │ <──────────────────────────  │  CLI (jalan  │
│  backend     │ ─────────────────────────────>│  di komputer │
│              │   balikan { repo_url, ... }   │  user)       │
└─────────────┘                                └──────┬───────┘
                                                        │
                                             git clone repo_url
                                                        ▼
                                              Project jadi di
                                              komputer user
```

## Kenapa Pendekatan Ini Dipilih (Bukan Hardcode Daftar Repo di CLI)

Jika daftar `slug ↔ repo_url` disimpan hardcoded di dalam kode CLI (`packages/cli/src/`), maka setiap kali admin menambah template baru, CLI HARUS di-build ulang dan dipublish ulang ke npm (`npm version patch && npm publish`) — ini lambat dan tidak scalable.

Dengan pendekatan slug + API real-time:
- Admin menambah template baru lewat admin panel → tersimpan ke database → **otomatis langsung bisa dipakai** lewat CLI yang SAMA PERSIS yang sudah dipublish sebelumnya, tanpa perlu update apapun di sisi CLI.
- Ini prinsip yang WAJIB dipertahankan di seluruh pengembangan proyek ini.

## Aturan Slug
- Format: huruf kecil, angka, dan tanda hubung (`-`) saja. Tidak boleh spasi, underscore, atau karakter spesial lain.
- Pola penamaan yang disarankan: `[kategori]-[varian]-[framework]`. Contoh: `ecommerce-basic-nextjs`, `ecommerce-supabase-midtrans-nextjs`, `landingpage-basic-nextjs`.
- Slug harus unique di seluruh tabel `templates` — divalidasi di level API sebelum insert/update (lihat `04-api-backend-architecture.md`).
- Slug TIDAK BOLEH diubah setelah template sudah dipublish dan pernah dipakai user (karena akan merusak command lama yang mungkin sudah dibagikan/disimpan orang). Jika perlu mengubah nama tampilan, ubah field `nama`, bukan `slug`.

## Implementasi di Sisi CLI
Lihat `02-cli-architecture.md` bagian "Alur Kerja index.ts", khususnya step 4 (Resolve slug ke repo_url) — ini adalah implementasi konkret dari konsep yang dijelaskan di file ini.

## Implementasi di Sisi API
Lihat `04-api-backend-architecture.md`, endpoint `GET /api/templates/:slug` — endpoint inilah yang menjadi "buku alamat" dalam diagram di atas.

## Referensi Silang
- Struktur data slug: `03-database-architecture.md`
- Endpoint yang menerjemahkan slug: `04-api-backend-architecture.md`
- Kode CLI yang memanggil endpoint ini: `02-cli-architecture.md`
