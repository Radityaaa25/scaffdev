# 16 — Design System & UI Guideline

## Tujuan
Memastikan konsistensi visual di seluruh halaman web (landing, builder, admin panel), terutama karena pengerjaan dilakukan oleh beberapa orang/AI agent secara paralel.

## Tech Stack Styling
- **Tailwind CSS v4** (versi terbaru, bukan v3) — konfigurasi langsung di file CSS menggunakan `@import 'tailwindcss'`, TIDAK menggunakan `tailwind.config.js` terpisah seperti versi lama.
- **shadcn/ui** — komponen dasar (button, input, dialog, dll) diambil dari sini, BUKAN membuat komponen dasar dari nol atau menginstall UI library lain (mis. Material UI, Ant Design) untuk menjaga konsistensi.

## Prinsip Visual
- Desain harus terasa "developer tool" — bersih, fungsional, tidak terlalu ramai dekorasi. Hindari gradient/animasi berlebihan yang umum di landing page generic.
- Prioritaskan keterbacaan command/kode — setiap kali menampilkan command (`CommandBox.tsx`), gunakan font monospace dan latar belakang gelap kontras, mirip tampilan terminal.
- Preview template (screenshot) harus ditampilkan dalam rasio yang konsisten di semua card (disarankan rasio 16:9 untuk semua screenshot yang diunggah admin).

## Palet Warna (Keputusan Final)
- **Tema:** Dark mode default, terinspirasi dev-tool modern seperti Kiro / Linear.
- **Warna dasar:**
  - Background: Hitam pekat (`#0A0A0B`)
  - Foreground / Teks: Putih bersih (`#FAFAFA`)
  - Border / Muted: Abu-abu gelap netral (Tailwind `zinc-800` / `zinc-900`)
- **Warna aksen:** Ungu signature (`#8B5CF6` / Violet 500) untuk CTA, tombol utama, highlight, dan branding Scaff.
- **Warna status:** Hijau untuk sukses, merah untuk error, kuning untuk peringatan — konsisten di seluruh komponen (termasuk pesan error CLI dan pesan error web).

## Komponen yang WAJIB Reusable (Bukan Ditulis Ulang di Tiap Halaman)
Semua ada di `packages/ui/`:
- `Button`, `Card`, `Badge`, `Dialog`, `Input`, `Textarea` — dari shadcn/ui, jangan dimodifikasi struktur dasarnya, cukup styling/theming
- `TemplateCard`, `CommandBox`, `IntegrationBadge` — komponen khusus proyek ini (lihat `05-web-frontend-architecture.md`)

## Tipografi
- **Font UI:** `Geist` (sans-serif modern dari Vercel untuk teks antarmuka yang clean dan tajam).
- **Font Monospace:** `Geist Mono` untuk seluruh command, code snippet, terminal preview, dan slug template.

## Aturan untuk Developer/AI Agent
- Sebelum membuat komponen visual baru, cek dulu apakah komponen serupa sudah ada di `packages/ui/` — jangan duplikasi.
- Semua styling menggunakan utility class Tailwind langsung di JSX, HINDARI menulis CSS terpisah kecuali untuk kasus yang benar-benar tidak bisa dilakukan dengan utility class (mis. animasi kompleks).
- Konsisten menggunakan skala spacing bawaan Tailwind (jangan membuat nilai spacing custom sembarangan seperti `mt-[13px]`).

## Referensi Silang
- Halaman yang menggunakan komponen ini: `05-web-frontend-architecture.md`, `06-admin-panel-architecture.md`
- Struktur folder `packages/ui`: `01-monorepo-structure.md`

## Catatan
File ini mencerminkan keputusan visual resmi untuk Scaff. Seluruh pengerjaan web UI dan komponen packages/ui wajib berpegang pada palet warna dan tipografi di atas.
