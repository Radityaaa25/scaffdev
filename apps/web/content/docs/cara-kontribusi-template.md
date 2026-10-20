---
title: Panduan Kontribusi Template
description: Panduan lengkap mengajukan template komunitas ke Scaff — standar kualitas, keamanan, demo, alur audit, dan apa yang terjadi setelah publish.
order: 8
section: Referensi
---

# Panduan Kontribusi Template

Kami menyambut kontribusi dari komunitas developer untuk memperkaya variasi template di katalog Scaff. Setiap template yang tampil di katalog melewati proses kurasi dan audit, jadi panduan ini sengaja dibuat detail: ikuti dari awal sampai pengajuan agar peluang lolos besar dan proses review cepat.

Estimasi usaha untuk template pertama: **1–3 hari** (termasuk testing, screenshot, dan dokumentasi).

> **Catatan penting:** Scaffdev saat ini mendukung **Next.js** dan **Laravel**. Dukungan framework lain akan ditambahkan seiring waktu. Template dengan stack lain belum bisa diterima.

---

## Yang perlu kamu tahu dulu

- Kontribusi ini **gratis** dan **bukan marketplace**. Tidak ada pembayaran, revenue share, atau akun kreator.
- Repo asli tetap **milikmu**. Kami hanya menyimpan **mirror** di organisasi `scaffdev` pada commit yang sudah diaudit, supaya template tidak hilang atau berubah sepihak.
- Nama author dan link repo asli tetap tampil sebagai kredit di halaman template.
- Template yang lolos akan mendapat badge **Community** dan bisa dipakai lewat `npx scaffdev@latest --template=<slug>`.
- Pengajuan **tidak otomatis publish**. Tim akan mengaudit commit tertentu (SHA), mengecek keamanan dan kualitas, lalu menghubungimu lewat email.

---

## Apa yang dicari (dan yang tidak diterima)

| Dicari | Tidak diterima |
|---|---|
| UI jadi dan bisa dinilai tanpa membaca kode | Folder kosong hasil `create-next-app` / `laravel new` |
| 3–5 halaman berfungsi, atau landing page kaya section | Hanya satu halaman "Hello World" |
| Next.js App Router + TypeScript + Tailwind, atau Laravel MVC + Blade | Stack deprecated / campuran Pages Router dan App Router |
| Responsif di mobile 360px dan desktop 1440px | Layout pecah di salah satu ukuran |
| README + `.env.example` yang bisa diikuti orang lain | Butuh penjelasan lisan atau setup rahasia |
| Demo publik yang stabil | Demo butuh login, pembayaran, atau whitelist IP |
| Aset dan dependency berlisensi jelas | Gambar/font/kode milik orang lain tanpa izin |
| Repo publik dengan histori bersih | Repo private atau ada secret di histori Git |

Kalau template-mu butuh integrasi (Supabase, Midtrans, dan seterusnya), tetap boleh. Pastikan template **tetap bisa jalan tanpa key asli** memakai data contoh atau mode demo.

---

## Sebelum mulai: checklist cepat

- [ ] Repo GitHub **publik** dan berisi lisensi (MIT disarankan).
- [ ] Sudah ada UI jadi + minimal 3–5 halaman (atau landing page lengkap).
- [ ] Sudah diuji dari **clone baru**, bukan hanya folder development.
- [ ] `README.md` dan `.env.example` lengkap dan sinkron.
- [ ] Tidak ada secret di kode **maupun histori Git**.
- [ ] Demo publik bisa dibuka tanpa login.
- [ ] Screenshot 16:9 minimal 1280px lebar.
- [ ] Tidak ada aset berhak cipta yang tidak kamu miliki izinnya.

---

## Prinsip Dasar Template Scaff

1. **UI Siap Pakai**: template bukan sekadar kerangka. Harus ada komponen UI terstruktur, navigasi yang berfungsi, dan minimal 3–5 halaman (atau satu landing page yang kaya section untuk kategori landing-page). Reviewer dan pengunjung harus bisa menilai kualitasnya tanpa membaca kode.
2. **Best Practice Modern**: Next.js memakai App Router (bukan Pages Router), TypeScript, dan Tailwind CSS. Laravel memakai struktur MVC standar, Blade, dan migrasi database yang rapi. Jangan memakai stack yang sudah deprecated.
3. **Bebas Kredensial Rahasia**: tidak boleh ada API key asli, token, secret webhook, atau kredensial apa pun yang ter-commit. Semua konfigurasi sensitif dibaca dari environment variable dengan contoh kosong di `.env.example`.
4. **Bisa Dijelaskan**: struktur folder, penamaan file, dan alur data harus bisa dijelaskan dalam 5 menit. Hindari abstraksi berlebihan yang hanya dimengerti pembuatnya.
5. **Bisa Dijalankan Orang Lain**: orang asing yang clone repo-mu harus bisa jalan dalam < 10 menit hanya dengan membaca `README.md` + `.env.example` + `SETUP.md`. Kalau butuh penjelasan lisan darimu, dokumentasinya belum cukup.
6. **Aman untuk Dijalankan**: tidak ada `eval`, eksekusi perintah dari input user, obfuscation, crypto mining, atau dependency yang jelas berbahaya. Template akan dijalankan di komputer pengguna lain.

---

## Standar Struktur Folder (Next.js)

Pastikan struktur repository template-mu tersusun rapi seperti contoh berikut:

```
[nama-template]/
├── app/                    → Next.js App Router (WAJIB, bukan Pages Router)
│   ├── (routes)/           → Halaman aplikasi
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/                 → Komponen atomik/reusable (button, card, dialog)
│   └── layout/             → Navbar, footer, sidebar
├── lib/
│   └── utils.ts            → Helper utilities
├── types/
│   └── index.ts            → Definisi tipe TypeScript
├── public/                 → Asset gambar & ikon
├── .env.example            → Template environment variable (kosong/placeholder)
├── .gitignore              → WAJIB menyertakan .env*, node_modules, .next
└── README.md               → Panduan singkat menjalankan template
```

Penjelasan tiap bagian:

- **`app/`**: wajib App Router. `layout.tsx` untuk kerangka global (font, metadata, provider), `page.tsx` per route. Jangan mencampur Pages Router (`pages/`) dalam template yang sama.
- **`components/ui` vs `components/layout`**: `ui` untuk komponen kecil reusable tanpa logika bisnis (Button, Card, Input, Badge); `layout` untuk kerangka halaman (Navbar, Footer, Sidebar). Komponen yang spesifik satu halaman (mis. `ProductCard` yang hanya dipakai di katalog) boleh di folder feature (`components/product/`), tapi dokumentasikan di README.
- **`lib/`**: helper murni (format rupiah, fetch wrapper, client Supabase). Satu file satu tanggung jawab; jangan menaruh komponen React di sini.
- **`types/`**: semua tipe shared (Product, Cart, Order). Hindari `any`. Kalau terpaksa, beri komentar alasannya.
- **`public/`**: gambar dioptimasi (kompres sebelum commit, maksimal ~200KB per file hero). Jangan commit file PSD / mentah berukuran besar.
- **`.env.example`**: lihat standar di bawah. Wajib ada walau template Basic tanpa integrasi (minimal berisi komentar "tidak ada env wajib").
- **`.gitignore`**: minimal mencakup `.env*`, `node_modules`, `.next`. Jangan mengandalkan `.gitignore` global di komputermu; harus ada di repo.
- **`README.md`**: minimal deskripsi 3–5 baris, prasyarat, command install → env → run, dan link ke `SETUP.md` untuk integrasi.

Untuk Laravel, padanannya: `routes/`, `app/Http/Controllers/`, `resources/views/`, `database/migrations/`, `.env.example`, dan `README.md` dengan langkah `composer install` → `cp .env.example .env` → `php artisan key:generate` → `php artisan serve`.

---

## Standar `.env.example` dan README

### `.env.example` yang baik

```bash
# --- Supabase ---
# URL project Supabase (Project Settings → API)
NEXT_PUBLIC_SUPABASE_URL=
# Anon key project Supabase (Project Settings → API)
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# --- Midtrans ---
# Server key (Settings → Access Keys, hanya di server!)
MIDTRANS_SERVER_KEY=
# Client key (untuk Snap di browser)
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=
```

Aturannya:

1. Satu section per layanan dengan header komentar.
2. Setiap variable punya komentar: diambil dari dashboard mana dan dipakai untuk apa.
3. Nilai selalu kosong (atau placeholder jelas seperti `your_api_key`). Jangan pernah mengisi key asli, walau key test — anggap semua yang ter-commit sebagai bocor.
4. Prefix `NEXT_PUBLIC_` hanya untuk key publik. Secret server tanpa prefix.
5. Variable yang dipakai kode harus ada di `.env.example`, dan sebaliknya.

### `README.md` minimal

1. Judul + 3–5 baris deskripsi (untuk siapa template ini).
2. Prasyarat (Node 18+ / PHP 8.2+).
3. Blok command install → env → run yang bisa di-copy paste.
4. Tabel env / link ke `SETUP.md` untuk daftar key.
5. Screenshot atau link demo.

---

## Standar Demo dan Screenshot

Demo yang baik membuat proses review jauh lebih cepat.

**Demo:**
- URL **HTTPS publik**, bisa dibuka tanpa login, tanpa pembayaran, dan tanpa whitelist IP.
- Stabil minimal selama proses review. Kalau memakai database, isi dengan data contoh yang aman.
- Tidak menampilkan data pribadi, email asli, atau dashboard admin.
- Loading wajar (< 5 detik) dan responsif di mobile.
- Kalau demo memakai backend, siapkan akun demo/read-only bila diperlukan — jangan berikan akses admin.

**Screenshot:**
- Rasio **16:9**, minimal **1280×720**.
- Ambil tampilan utama (hero / halaman katalog), bukan browser chrome atau desktop penuh.
- Tidak ada data pribadi, notifikasi, atau tab lain yang ikut terlihat.
- Format PNG/JPG/WebP. Upload lewat form maksimal **1MB**; usahakan < 500KB agar cepat.

Link demo bersifat opsional saat submit, tetapi **sangat disarankan**. Kalau tidak ada demo, reviewer menilai dari screenshot dan kode.

---

## Keamanan dan Legal

Ini bagian yang paling sering menggagalkan pengajuan. Baca perlahan.

### Secret dan histori Git

- Hapus `.env`, token, dan key dari **seluruh histori**, bukan hanya commit terakhir. Gunakan `git filter-repo` atau BFG, lalu rotasi key yang pernah ter-commit.
- Periksa juga file seperti `next.config.js`, `docker-compose.yml`, workflow CI, dan file contoh yang tidak sengaja berisi nilai asli.
- Jangan mengandalkan `.gitignore` saja: file yang pernah ter-commit tetap ada di histori.

### Dependency dan aset

- Gunakan dependency yang masih dirawat dan lisensinya jelas.
- Jangan menyalin kode, gambar, font, atau ilustrasi dari template/situs lain tanpa izin.
- Sertakan file `LICENSE` (MIT disarankan) dan catatan lisensi aset pihak ketiga bila ada.
- Hindari dependency dengan lisensi yang melarang redistribusi.

### Hak dan izin (CLA)

Saat submit, kamu menyatakan bahwa:

1. Kamu pemilik atau punya izin atas seluruh kode dan aset template.
2. Scaffdev boleh menyimpan **mirror** repo dan menampilkan screenshot/demo di katalog.
3. Kredit author dan link repo asli tetap dicantumkan.
4. Kamu bertanggung jawab bila ada klaim hak cipta dari pihak lain.

Repo asli tetap milikmu. Mirror hanya untuk distribusi dan menjaga kestabilan template.

### Data dan privasi

- Jangan menyertakan data pengguna asli di seed/demo.
- Jangan mengirim email, nomor telepon, atau alamat asli ke repository.
- Form kontribusi meminta email kontak; email itu **tidak pernah ditampilkan publik** dan hanya dipakai tim untuk komunikasi review.

---

## Alur Pengajuan Kontribusi

### 1. Bangun template

Bangun project di repository GitHub publik milikmu sendiri (belum perlu fork organisasi apa pun). Pastikan repo publik sejak awal agar bisa di-clone tanpa token.

### 2. Uji dari clone baru

Lakukan clone ke folder baru yang kosong, lalu jalankan dari nol mengikuti `README.md`-mu sendiri tanpa improvisasi:

```bash
npm install
cp .env.example .env.local
npm run dev
```

```bash
npm run lint
npm run build
```

Kalau ada langkah yang hanya jalan di komputermu tapi gagal di folder fresh, perbaiki dokumentasi/kodenya. Reviewer akan melakukan hal yang sama.

### 3. Siapkan materi pengajuan

- Link repository publik.
- Nama template, deskripsi singkat, kategori, dan framework.
- Link demo (opsional, sangat disarankan).
- Screenshot 16:9.
- Daftar integrasi yang digunakan beserta env var-nya.
- Nama/username author (wajib) dan link profil (opsional).

**Kategori:** pilih salah satu kategori yang tersedia, atau pilih **Lainnya** lalu tulis nama kategorimu sendiri (contoh: `kesehatan`, `keuangan`). Nama itu akan dinormalisasi menjadi slug huruf kecil, mis. `Kesehatan & Kecantikan` → `kesehatan-kecantikan`. Tim akan mendaftarkan kategori baru saat review.

### 4. Kirim lewat form kontribusi

Buka [halaman Kontribusi Template](/kontribusi), isi data, unggah screenshot, lalu baca dan setujui **Syarat & Ketentuan** (bisa diklik, muncul popup) beserta pernyataan kontribusi/CLA. Setelah terkirim, submission masuk antrean review dengan status `pending`.

Syarat & Ketentuan mencakup kepemilikan template, izin mirror/distribusi, aturan konten terlarang, penggunaan data kontak, dan cara penarikan template. Baca dulu sebelum mencentang, karena persetujuan berlaku sebagai bukti proses review.

### 5. Audit oleh tim

Tim akan:

- Menentukan **satu commit (SHA)** yang diaudit. Perubahan setelah SHA tersebut tidak ikut dinilai.
- Menjalankan audit statis untuk mencari pola berisiko, dependency mencurigakan, dan konfigurasi berbahaya.
- Mengecek secret di histori, struktur repo, `README`, `.env.example`, lisensi, dan kualitas UI.
- Membuka demo dan mencoba build/lint dari clone baru.

Audit statis bukan jaminan template 100% aman. Review manual tetap dilakukan, dan temuan `HIGH`/`CRITICAL` menjadi dasar penolakan atau permintaan revisi.

### 6. Review dan keputusan

Kamu akan dihubungi lewat email dengan salah satu hasil:

| Status | Arti |
|---|---|
| `pending` | Submission diterima dan menunggu antrean. |
| `auditing` | Sedang diperiksa; commit audit dicatat. |
| `needs_revision` | Ada yang harus diperbaiki. Perbaiki di repo, lalu balas email. |
| `accepted` | Lolos audit; draft template dibuat dan proses mirror dimulai. |
| `published` | Template live di katalog dan bisa dipakai lewat CLI. |
| `rejected` | Tidak lolos. Alasannya akan dijelaskan agar bisa diperbaiki. |

Tidak ada jaminan waktu review. Semakin lengkap materi dan semakin bersih repo, semakin cepat prosesnya.

### 7. Mirror dan publish

Bila lolos:

1. Tim menyalin repo ke organisasi `scaffdev` pada **commit yang diaudit**.
2. Template didaftarkan dengan slug resmi dan badge **Community**.
3. Nama author + link repo asli ditampilkan sebagai kredit.
4. Template bisa dipakai lewat `npx scaffdev@latest --template=<slug>`.

Repo asli tetap ada dan tetap milikmu. Kamu tidak perlu memindahkan atau menghapusnya.

---

## Setelah Publish

### Update template

1. Buka PR ke mirror `scaffdev/template-<slug>`.
2. Tim mengaudit commit baru.
3. `audited_commit` diperbarui dan template di-publish ulang bila lolos.

Jangan mengubah repo asli tanpa memberi tahu tim bila perubahan itu memengaruhi kredit atau lisensi.

### Takedown

Kalau kamu ingin template ditarik, hubungi tim lewat email yang sama saat review. Template akan di-unpublish, tetapi histori audit tetap disimpan sebagai bukti proses.

---

## Checklist Final Sebelum Submit

Salin dan centang sebelum menekan tombol kirim:

- [ ] Repo publik, ada `LICENSE`, dan tidak ada secret di histori.
- [ ] UI jadi, responsif, dan minimal 3–5 halaman / landing page lengkap.
- [ ] `README.md` cukup untuk menjalankan dari clone baru.
- [ ] `.env.example` lengkap dan sinkron dengan kode.
- [ ] `npm run lint` dan `npm run build` lolos (atau padanan Laravel).
- [ ] Tidak ada `console.log` debug, dependency tak terpakai, atau kode terkomentari massal.
- [ ] Demo publik bisa dibuka tanpa login (bila ada).
- [ ] Screenshot 16:9, minimal 1280×720, tanpa data pribadi.
- [ ] Aset dan dependency berlisensi jelas.
- [ ] Sudah membaca dan menyetujui **Syarat & Ketentuan** serta pernyataan CLA di form.
- [ ] Kategori sudah dipilih (atau diisi sendiri lewat opsi **Lainnya**).

---

## Alasan Penolakan yang Paling Sering

1. Ada API key / secret ter-commit di histori Git (bukan hanya di file saat ini).
2. `README.md` tidak cukup untuk menjalankan project dari nol.
3. `.env.example` tidak sinkron dengan kode.
4. Build / lint gagal di folder fresh.
5. Template masih folder kosong `create-next-app` / `laravel new` tanpa UI jadi.
6. Demo butuh login, pembayaran, atau tidak bisa diakses publik.
7. Aset/font/gambar milik orang lain tanpa izin.
8. Repo berubah setelah commit audit, tetapi tidak diberitahukan.

Hindari delapan hal di atas dan peluang lolos sangat besar.

---

## FAQ

**Apakah saya dibayar?**
Tidak. Ini kontribusi komunitas, bukan marketplace. Kredit author dan badge Community adalah bentuk apresiasi kami.

**Apakah repo saya dipindahkan ke Scaffdev?**
Tidak. Repo asli tetap milikmu. Kami hanya menyimpan mirror pada commit yang diaudit.

**Boleh repo private?**
Tidak. Reviewer dan pengguna CLI harus bisa mengakses repo tanpa token.

**Framework selain Next.js/Laravel?**
Belum. Dukungan framework lain sedang dipertimbangkan.

**Berapa lama review?**
Tidak ada SLA. Antrean bergantung pada jumlah submission dan kelengkapan materi.

**Boleh memakai template orang lain sebagai dasar?**
Hanya jika lisensinya mengizinkan dan kamu mencantumkan atribusi yang benar. Jangan menghapus lisensi asli.

**Bagaimana kalau ditolak?**
Perbaiki sesuai catatan, lalu ajukan ulang. Tidak ada penalti.

**Apakah email saya tampil di web?**
Tidak. Email hanya dipakai tim untuk komunikasi review.

**Apakah bisa minta template dihapus setelah publish?**
Bisa. Hubungi tim; template akan di-unpublish. Histori audit tetap disimpan.

---

## Butuh Bantuan?

- [Halaman Kontribusi Template](/kontribusi) — form pengajuan.
- [Panduan Keamanan](/docs/audit-keamanan) — audit dependensi dan praktik aman.
- [Lisensi](/docs/lisensi) — ketentuan penggunaan dan distribusi.
- [Env dan Setup](/docs/env-dan-setup) — standar `.env.example` dan `SETUP.md`.
- [FAQ umum](/docs/faq) — pertanyaan di luar kontribusi.
