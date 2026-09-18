# 08 — Template Best Practice Standard

## Tujuan File Ini
Checklist WAJIB yang harus dipenuhi SETIAP template baru sebelum dipublikasikan (ditambahkan ke admin panel dan diset `is_published = true`). Karena template dibuat oleh anggota tim yang berbeda-beda (dengan bantuan AI), standar ini memastikan hasil akhirnya tetap konsisten walau dikerjakan oleh orang/AI agent berbeda dari laptop berbeda.

## Prinsip Utama
Template dasar (tanpa integrasi apapun) BUKAN sekadar `create-next-app` kosong. Template harus sudah tersusun mengikuti best practice — terstruktur, siap dikembangkan, walau isinya minimal.

## Checklist Struktur Folder (Next.js)

```
[nama-project]/
├── app/                    → App Router (WAJIB, bukan Pages Router lama)
│   ├── (routes)/           → route groups sesuai kebutuhan kategori (mis. (shop) untuk e-commerce)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                 → komponen kecil reusable (button, card, dll — dari shadcn/ui)
│   └── layout/             → navbar, footer, dan komponen struktural
├── lib/
│   └── utils.ts
├── types/
│   └── index.ts            → TypeScript types terpusat
├── public/
├── .env.example            → WAJIB ADA, walau kosong untuk template basic
├── .eslintrc.json
├── .prettierrc
├── .gitignore              → WAJIB memasukkan .env, .env.local, node_modules, .next
└── README.md                → deskripsi singkat template ini
```

## Checklist Kode Wajib
- [ ] TypeScript digunakan di seluruh project (bukan JavaScript biasa)
- [ ] ESLint dan Prettier sudah dikonfigurasi dan tidak menghasilkan error saat `npm run lint`
- [ ] Tidak ada hardcoded value yang seharusnya menjadi environment variable (API key, URL endpoint, dll)
- [ ] Semua komponen menggunakan konvensi penamaan PascalCase untuk nama file dan nama komponen
- [ ] Tidak ada `console.log` yang tertinggal di kode final
- [ ] Tidak ada dependency yang tidak terpakai di `package.json`
- [ ] Struktur folder sesuai kategori template (lihat contoh spesifik per kategori di bawah)

## Struktur Spesifik per Kategori

### E-commerce
Folder/halaman minimal yang harus ada: `app/(shop)/products/`, `app/(shop)/cart/`, `app/(shop)/checkout/`, komponen `ProductCard.tsx`, `CartItem.tsx`.

### Landing Page
Folder/halaman minimal: section-based single page (`Hero`, `Features`, `Pricing`, `CTA`, `Footer` sebagai komponen terpisah di `components/sections/`).

### Portfolio
Folder/halaman minimal: `app/projects/`, `app/about/`, komponen `ProjectCard.tsx`.

## Checklist Keamanan (WAJIB, Lihat Juga `15-security-guidelines.md`)
- [ ] File `.env` (isi asli, bukan `.env.example`) TIDAK ADA di dalam repo dan sudah masuk `.gitignore`
- [ ] Tidak ada API key/secret apapun ter-hardcode di kode manapun, termasuk di file konfigurasi
- [ ] Jika template menyertakan contoh kode integrasi (mis. `lib/supabase.ts`), file tersebut berisi placeholder yang membaca dari `process.env`, BUKAN nilai asli

## Proses Pembuatan Template Menggunakan AI
Karena template dibuat dengan bantuan AI (Claude/ChatGPT) oleh anggota tim berbeda:
1. Gunakan checklist di file ini sebagai instruksi/prompt awal ke AI saat meminta bantuan generate boilerplate.
2. WAJIB review manual hasil generate AI sebelum dianggap template final — cek semua poin checklist di atas satu per satu.
3. Setelah lolos review, baru boleh di-push ke repo GitHub publik dan didaftarkan lewat admin panel.

## Proses Verifikasi Sebelum Publish
Sebelum admin men-set `is_published = true` untuk template baru:
1. Clone repo secara manual ke lokal, jalankan `npm install && npm run dev`, pastikan project berjalan tanpa error.
2. Cocokkan struktur folder dengan checklist di file ini.
3. Pastikan `.env.example` dan `README.md` di dalam repo template sudah sesuai (ini terpisah dari `SETUP.md` yang di-generate CLI — lihat catatan di `12-env-and-setup-doc-generation.md`).

## Referensi Silang
- Detail teknis `.env.example` yang di-generate CLI (berbeda dari yang ada di repo template): `12-env-and-setup-doc-generation.md`
- Aturan keamanan lebih lengkap: `15-security-guidelines.md`
- Panduan visual/UI: `16-design-system-ui-guideline.md`
