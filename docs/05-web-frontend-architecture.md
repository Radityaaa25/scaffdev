# 05 — Web Frontend Architecture

## Lokasi Kode
`apps/web/app/` — Next.js App Router.

## Struktur Route

```
apps/web/app/
├── page.tsx                       → Landing page (penjelasan produk, CTA ke /builder)
├── templates/
│   ├── page.tsx                   → Halaman jelajah SEMUA template, filter berdasarkan kategori/framework
│   └── [slug]/
│       └── page.tsx               → Detail satu template (preview lebih besar, deskripsi lengkap, tombol "Pakai Template Ini" -> lanjut ke command)
├── docs/
│   ├── page.tsx                   → Landing dokumentasi (daftar isi, pencarian sederhana)
│   └── [...slug]/
│       └── page.tsx               → Render satu halaman dokumentasi dari file markdown
├── builder/
│   ├── page.tsx                   → Step 1: pilih kategori project
│   ├── [kategori]/
│   │   └── page.tsx               → Step 2: pilih framework (filter dari kategori yang dipilih)
│   └── [kategori]/[framework]/
│       └── page.tsx               → Step 3: preview template + pilih kombinasi + tampilkan command final
├── admin/
│   ├── login/page.tsx
│   ├── page.tsx                   → Dashboard daftar template
│   └── templates/
│       ├── new/page.tsx           → Form tambah template baru
│       └── [slug]/edit/page.tsx   → Form edit template
└── api/                           → lihat 04-api-backend-architecture.md
```

## Halaman `/templates` (Jelajah Semua Template)

Berbeda dari `/builder` (alur bertahap kategori → framework → preview, ditujukan untuk user yang ingin langsung generate project), halaman `/templates` adalah katalog terbuka — user bisa melihat SEMUA template sekaligus dan menyaring sendiri.

- Fetch `GET /api/templates` (tanpa filter di request awal), tampilkan seluruh template dalam grid card.
- Filter di sisi client: dropdown/chip untuk `kategori` dan `framework`, sinkron dengan URL query (`?kategori=ecommerce&framework=nextjs`) agar hasil filter bisa dibagikan sebagai link.
- Setiap card mengarah ke `/templates/[slug]` untuk detail lebih lengkap (screenshot lebih besar, deskripsi penuh, daftar integrasi yang disertakan).
- Di halaman detail `/templates/[slug]`, tombol utama "Pakai Template Ini" membawa user ke command final — bisa langsung menampilkan `CommandBox` di halaman yang sama (tanpa perlu mengulang alur builder dari awal), karena slug sudah diketahui.
- Halaman ini dan `/builder` mengonsumsi endpoint API yang SAMA (`GET /api/templates`, `GET /api/templates/:slug`) — hanya berbeda dari sisi UX (katalog vs alur bertahap).

## Halaman `/docs` (Dokumentasi untuk User, BUKAN untuk Tim Internal)

Penting: ini BERBEDA dari folder `docs/` di root monorepo (yang berisi dokumentasi arsitektur untuk tim/AI agent). Halaman `/docs` di web adalah dokumentasi PUBLIK untuk USER PRODUK — cara pakai CLI, penjelasan integrasi yang tersedia, FAQ, dst.

- Sumber konten: file markdown terpisah, disimpan di `apps/web/content/docs/*.md` (folder BARU, khusus konten dokumentasi publik, TIDAK bercampur dengan `docs/` arsitektur internal di root).
- `apps/web/app/docs/page.tsx` menampilkan daftar isi (mengambil daftar file dari `content/docs/`).
- `apps/web/app/docs/[...slug]/page.tsx` merender satu file markdown jadi halaman (gunakan library ringan seperti `next-mdx-remote` atau parser markdown-to-HTML, sesuaikan dengan yang tersedia; styling mengikuti `16-design-system-ui-guideline.md`, termasuk blok command dengan font monospace).
- Isi minimal dokumentasi publik yang perlu ada untuk MVP: "Cara Install & Pakai CLI", "Daftar Integrasi yang Didukung", "FAQ", "Cara Kontribusi Template" (menjelaskan standar dari `08-template-best-practice-standard.md` versi disederhanakan untuk pembaca eksternal).

## Alur Halaman Builder (User Flow Detail)

### Step 1 — `/builder`
Menampilkan pilihan kategori dalam bentuk card visual: E-commerce, Landing Page, Portfolio. Setiap card menunjukkan jumlah template yang tersedia di kategori itu (query ke `GET /api/templates?kategori=xxx` untuk hitung).

### Step 2 — `/builder/[kategori]`
Menampilkan pilihan framework yang tersedia untuk kategori tersebut (untuk MVP hanya Next.js yang aktif, Laravel ditampilkan sebagai "Segera Hadir" / disabled).

### Step 3 — `/builder/[kategori]/[framework]`
- Fetch `GET /api/templates?kategori=xxx&framework=yyy`, tampilkan semua kombinasi yang tersedia sebagai card dengan screenshot preview.
- Setiap card menunjukkan: nama template, daftar integrasi yang disertakan (badge kecil per integrasi), tombol "Pilih".
- Setelah user klik "Pilih", tampilkan section command final:
  ```
  npx scaffdev@latest --template=[slug-yang-dipilih]
  ```
  dengan tombol copy-to-clipboard.
- Di bawah command, tampilkan catatan prasyarat sesuai framework (lihat `09-multi-framework-support.md` untuk teks yang harus ditampilkan).

## Komponen Utama (`apps/web/components/`)
- `TemplateCard.tsx` — menampilkan satu template (screenshot, nama, badge integrasi, tombol pilih)
- `CommandBox.tsx` — menampilkan command dengan tombol copy
- `IntegrationBadge.tsx` — badge kecil untuk menampilkan nama integrasi (Supabase, Midtrans, dll)
- `AiRecommendWidget.tsx` — widget chat untuk fitur AI Recommendation Assistant (lihat `13-ai-recommendation-assistant.md`)
- `AiSetupChatWidget.tsx` — widget chat untuk troubleshooting setup (lihat `14-ai-setup-chatbot.md`)

## State Management
Untuk MVP, TIDAK PERLU state management library eksternal (Redux/Zustand). Gunakan:
- React Server Components untuk fetch data awal (kategori, daftar template)
- `useState`/`useSearchParams` untuk state pilihan sementara di sisi client (kategori/framework yang sedang dipilih, tersimpan di URL query agar bisa di-share/refresh)

## Styling
Tailwind CSS v4 + shadcn/ui. Lihat `16-design-system-ui-guideline.md` untuk aturan visual detail (warna, spacing, komponen yang boleh dipakai).

## Aturan untuk Developer/AI Agent
- Semua fetch data ke API HARUS melalui fungsi terpusat di `apps/web/lib/api.ts`, jangan panggil `fetch` langsung tersebar di banyak komponen — memudahkan perubahan endpoint di kemudian hari.
- Halaman builder harus tetap fungsional walau JavaScript lambat load (progressive enhancement) — gunakan Server Components sebisa mungkin untuk data awal, Client Components hanya untuk bagian interaktif (pilih kombinasi, copy command, chat widget).

## Referensi Silang
- Endpoint yang dikonsumsi: `04-api-backend-architecture.md`
- Panduan visual: `16-design-system-ui-guideline.md`
- Fitur AI di halaman ini: `13-ai-recommendation-assistant.md`, `14-ai-setup-chatbot.md`