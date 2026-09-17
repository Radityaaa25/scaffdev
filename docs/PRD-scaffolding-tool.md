# Product Requirements Document (PRD)

**Nama Produk:** Scaff
**Versi Dokumen:** 1.0
**Tanggal:** 3 September 2026
**Status:** Draft untuk Lomba Web Dev

---

## 1. Ringkasan Eksekutif

Scaff adalah platform berbasis web dan CLI yang memungkinkan developer membuat project baru (E-commerce, Landing Page, dll) secara instan dengan struktur folder, boilerplate, dan tampilan visual yang sudah jadi — bukan sekadar struktur kosong. User memilih jenis project dan framework secara visual di web, melihat preview template, lalu mendapatkan satu command yang tinggal di-copy-paste ke terminal untuk men-generate seluruh project siap pakai.

Produk ini membedakan diri dari scaffolding tool yang sudah ada (`create-next-app`, `create-vite`, dll) melalui tiga hal: (1) UX visual berbasis web, bukan CLI-only, (2) template yang sudah memiliki tampilan/UI jadi, bukan boilerplate kosong, dan (3) kurasi konteks Indonesia (integrasi Midtrans, RajaOngkir, dll sebagai referensi dokumentasi, bukan generic Stripe).

---

## 2. Latar Belakang & Masalah

### 2.1 Masalah yang Diselesaikan
Setiap kali developer memulai project baru, mereka harus:
- Menyusun struktur folder dari nol atau mengandalkan template minimal bawaan framework
- Mencari & mempelajari cara integrasi service pihak ketiga (auth, database, payment) satu per satu dari dokumentasi masing-masing
- Untuk konteks Indonesia, banyak tutorial/starter kit yang tersedia berorientasi ke service luar negeri (Stripe, dll) yang kurang relevan untuk kebutuhan lokal (Midtrans, Xendit, RajaOngkir)

### 2.2 Kondisi Saat Ini (Existing Solutions)
| Solusi | Kelebihan | Kekurangan |
|---|---|---|
| `create-next-app`, `create-vite` | Resmi, gratis, cepat | Struktur minimal/kosong, CLI-only, generic |
| AppGen, AppForge, dll | Multi-framework | Tetap CLI-first, kurang visual, kurang kurasi lokal |
| Beli template ThemeForest, dll | Tampilan sudah jadi | Tidak terintegrasi command generate otomatis, berbayar per item |

### 2.3 Peluang
Belum ada solusi yang menggabungkan: **pemilihan visual di web + template dengan tampilan sudah jadi + generate otomatis lewat satu command + kurasi konteks lokal Indonesia** dalam satu produk yang sama.

---

## 3. Tujuan Produk

### 3.1 Tujuan untuk Lomba (Jangka Pendek)
- Mendemonstrasikan alur end-to-end: pilih template di web → dapat command → generate project nyata di terminal
- Menunjukkan minimal 2-3 kombinasi template berkualitas (bukan kuantitas)
- Menunjukkan integrasi AI yang bernilai tambah nyata (bukan gimmick)
- Menunjukkan pemahaman arsitektur sistem yang matang (termasuk batasan & roadmap yang jujur)

### 3.2 Tujuan Jangka Panjang (Visi Produk, di Luar Lomba)
- Menjadi rujukan utama starter kit developer Indonesia untuk kebutuhan web app umum (e-commerce, landing page, dashboard)
- Membuka model bisnis marketplace template pihak ketiga (revenue share) setelah fondasi produk & proses keamanan matang
- Menyediakan fitur kustomisasi penuh (kombinasi bebas database/auth/payment) sebagai fitur premium/berlangganan

---

## 4. Target Pengguna

### 4.1 Persona Utama
**Developer individu / tim kecil (2-5 orang)**
- Membangun side project, MVP startup, atau project klien
- Sudah familiar command line, tapi ingin menghemat waktu setup awal
- Butuh referensi integrasi yang relevan dengan konteks Indonesia

### 4.2 Persona Sekunder
**Developer junior / bootcamp graduate**
- Butuh contoh struktur project yang mengikuti best practice
- Belum terbiasa menyusun arsitektur project dari nol

### 4.3 Model Bisnis
B2C (developer individu, gratis di tahap MVP) dengan potensi ekspansi B2B (tim/perusahaan kecil) dan model freemium (fitur kustomisasi penuh sebagai berlangganan) di roadmap jangka panjang.

---

## 5. Lingkup Produk (Scope)

### 5.1 MVP — Yang DIBANGUN untuk Lomba

**Fitur Wajib:**
1. Halaman web untuk memilih jenis project (E-commerce, Landing Page, Portfolio)
2. Halaman web untuk memilih framework (Next.js sebagai prioritas utama)
3. Preview visual template (screenshot atau live demo) sebelum memilih
4. Sistem "kombinasi terbatas" — beberapa paket pre-built (bukan kombinasi bebas):
   - `[kategori]-basic-nextjs` (tanpa integrasi apapun, hanya struktur best-practice)
   - `[kategori]-supabase-midtrans-nextjs` (kombinasi paling umum)
5. Generate command siap paste (`npx scaffdev@latest --template=slug`)
6. CLI package yang dipublish ke npm, bisa dipanggil via `npx` maupun install global
7. CLI otomatis generate `.env.example` dan `SETUP.md` sesuai template yang dipilih
8. Admin panel sederhana untuk menambah/mengelola metadata template (nama, framework, kategori, link repo GitHub, deskripsi, screenshot)
9. AI Recommendation Assistant — user menjelaskan kebutuhan dalam bahasa natural, AI merekomendasikan kombinasi template yang sesuai dari daftar yang tersedia
10. AI Setup Assistant — chatbot yang menjawab pertanyaan seputar instalasi/troubleshooting berdasarkan dokumentasi SETUP.md yang ada

**Di Luar Scope MVP (Eksplisit TIDAK Dibangun):**
- Kustomisasi bebas (pilih database APAPUN + payment APAPUN secara independen) — lihat Bagian 9
- Marketplace template pihak ketiga dengan proses inspeksi keamanan
- Auto-provisioning akun ke service pihak ketiga (Supabase, Midtrans, dll)
- Framework selain Next.js (Laravel dkk masuk roadmap)
- Sistem login/berlangganan berbayar

### 5.2 Roadmap Pasca-MVP
- Dukungan Laravel (via Composer, dijalankan sebagai child process dari CLI Node.js yang sama)
- Sistem kustomisasi penuh berbasis arsitektur "base template + modular injection" (lihat Bagian 9), dibuka sebagai fitur berlangganan
- Marketplace titip-jual template dengan proses inspeksi keamanan & revenue share
- Autentikasi user (login) untuk menyimpan preferensi & riwayat generate

---

## 6. Alur Pengguna (User Flow)

### 6.1 Alur Utama — Generate Project via Web
1. User membuka website
2. User memilih kategori project (mis. E-commerce)
3. User memilih framework (mis. Next.js)
4. Sistem menampilkan preview visual template yang tersedia untuk kombinasi tersebut
5. User memilih dari kombinasi yang tersedia (basic / dengan integrasi tertentu)
6. Sistem menampilkan command siap copy: `npx scaffdev@latest --template=ecommerce-basic-nextjs`
7. User membuka terminal, paste command, tekan enter
8. CLI menjalankan proses: resolve slug → ambil repo_url dari API → `git clone` → tampilkan pesan sukses beserta langkah selanjutnya (baca SETUP.md)
9. User membuka folder project, mengikuti `SETUP.md` untuk mengisi `.env` sesuai integrasi yang dipilih

### 6.2 Alur Alternatif — Generate via CLI Langsung (Tanpa Web)
1. User yang sudah familiar menjalankan `npx scaffdev@latest` tanpa parameter
2. CLI menampilkan interactive prompt (pilih kategori → framework → kombinasi) langsung di terminal
3. Lanjut ke langkah 8-9 pada alur utama

### 6.3 Alur AI Recommendation Assistant
1. User mengetik kebutuhan dalam bahasa natural di chat widget (mis. "mau bikin toko baju kecil-kecilan, budget minim")
2. AI menganalisis input, mencocokkan dengan daftar kombinasi template yang tersedia (bukan generate baru)
3. AI menampilkan rekomendasi beserta alasan (mis. "Supabase karena gratis untuk skala kecil, Midtrans karena mendukung banyak metode bayar lokal")
4. User klik rekomendasi → diarahkan ke halaman preview & command generate

### 6.4 Alur Admin — Menambah Template Baru
1. Admin login ke halaman admin (proteksi password/login sederhana)
2. Admin mengisi form: nama template, framework, kategori, link repo GitHub (public), deskripsi, screenshot, daftar opsi integrasi yang disertakan
3. Sistem generate slug secara otomatis (atau admin isi manual)
4. Data tersimpan ke database (metadata + slug + repo_url saja, bukan isi kode)
5. Template baru otomatis muncul di web dan bisa langsung dipanggil lewat CLI tanpa perlu update/republish CLI

---

## 7. Kebutuhan Fungsional (Functional Requirements)

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-01 | User dapat memilih kategori & framework project di web | Wajib |
| F-02 | User dapat melihat preview visual template sebelum memilih | Wajib |
| F-03 | Sistem menghasilkan command CLI yang valid dan bisa di-copy | Wajib |
| F-04 | CLI dapat dijalankan via `npx` tanpa instalasi permanen | Wajib |
| F-05 | CLI dapat di-install secara global dan dipanggil kapan saja | Sebaiknya Ada |
| F-06 | CLI menghasilkan `.env.example` sesuai integrasi yang dipilih | Wajib |
| F-07 | CLI menghasilkan `SETUP.md` berisi panduan setup tiap integrasi | Wajib |
| F-08 | CLI melakukan pengecekan prasyarat (Node.js/Composer) sebelum generate | Sebaiknya Ada |
| F-09 | Admin dapat menambah/mengedit/menghapus metadata template | Wajib |
| F-10 | Sistem dapat menambah template baru tanpa perlu update CLI yang sudah dipublish | Wajib |
| F-11 | AI dapat merekomendasikan kombinasi template dari input bahasa natural | Wajib |
| F-12 | AI dapat menjawab pertanyaan troubleshooting berdasarkan dokumentasi setup | Sebaiknya Ada |
| F-13 | Repo template disimpan di GitHub Organization, dapat di-clone tanpa autentikasi (public) | Wajib |

---

## 8. Kebutuhan Non-Fungsional

- **Keamanan:** Tidak ada API key/secret asli yang tersimpan di dalam repo template (wajib menggunakan `.gitignore` untuk `.env` asli). 2FA aktif di akun/organization GitHub.
- **Skalabilitas:** Penambahan template baru tidak boleh memerlukan perubahan kode CLI atau republish ke npm.
- **Performa:** Proses `git clone` dan generate file tambahan (`.env.example`, `SETUP.md`) idealnya selesai dalam hitungan detik untuk template berskala kecil-menengah.
- **Ketersediaan:** Web dan API di-deploy di infrastruktur gratis (Vercel + Supabase) yang cukup andal untuk skala demo/awal.
- **Kejujuran Scope:** Sistem tidak mengklaim kemampuan auto-provisioning akun pihak ketiga; batasan ini dikomunikasikan secara eksplisit ke user melalui `SETUP.md` dan UI.

---

## 9. Catatan Arsitektur Penting

### 9.1 Kenapa MVP Menggunakan "Kombinasi Terbatas", Bukan Kustomisasi Bebas
Kustomisasi bebas (memilih database APAPUN + payment gateway APAPUN secara independen) memerlukan arsitektur "base template + modular code injection" — satu template dasar tanpa integrasi, digabung dengan "paket" kode per integrasi yang disisipkan otomatis ke file yang sesuai (menggunakan teknik marker/comment injection). Jumlah kombinasi yang mungkin meningkat secara eksponensial jika dibangun sebagai kombinasi bebas, dan proses penyisipan kode otomatis ini kompleks untuk dijamin kebenarannya dalam waktu terbatas.

**Keputusan:** MVP menyediakan beberapa kombinasi pre-built yang sudah direview manual (bukan hasil injection otomatis). Arsitektur modular injection didokumentasikan sebagai roadmap fitur premium/berlangganan pasca-lomba.

### 9.2 Kenapa AI Tidak Men-generate Kode Integrasi Secara Real-Time
AI (LLM) berisiko menghasilkan kode yang salah atau usang untuk integrasi security-critical (payment, auth) — risiko ini terlalu besar untuk kode yang langsung dipakai user tanpa review manusia. Keputusan: AI hanya berperan sebagai (1) asisten rekomendasi kombinasi dari daftar yang sudah ada dan direview, dan (2) asisten troubleshooting berbasis dokumentasi resmi — bukan generator kode integrasi.

### 9.3 Sistem Slug sebagai Penghubung Command dan Repository
Command yang ditampilkan ke user tidak pernah menyebut URL repository secara langsung, melainkan menggunakan slug (kode pendek, mis. `ecommerce-basic-nextjs`). CLI menerjemahkan slug menjadi URL repository secara real-time melalui pemanggilan API backend, bukan menyimpan daftar repository secara hardcoded di dalam kode CLI. Hal ini memungkinkan penambahan template baru tanpa perlu mempublish ulang CLI ke npm.

### 9.4 Multi-Framework (Next.js & Laravel)
CLI tetap berupa satu package Node.js/npm. Untuk framework berbasis Composer (Laravel), CLI menjalankan command Composer sebagai child process dari dalam kode Node.js. User tetap wajib menyiapkan prasyarat masing-masing framework (Node.js untuk Next.js, PHP & Composer untuk Laravel) secara mandiri — ini merupakan praktik standar yang sama dengan tool sejenis (`create-next-app` juga tidak menginstalkan Node.js untuk penggunanya).

---

## 10. Tech Stack

| Layer | Teknologi | Alasan |
|---|---|---|
| Monorepo tooling | Turborepo | Native untuk ekosistem Next.js/Vercel, caching build cepat, gratis |
| Web app | Next.js (App Router, versi terbaru) | Sesuai keahlian tim, ekosistem besar |
| Styling | Tailwind CSS v4 | Versi terbaru, setup lebih sederhana dari v3, performa lebih cepat |
| Komponen UI | shadcn/ui | Komponen siap pakai, dapat dikustomisasi penuh, gratis |
| Database & Auth | Supabase | Postgres + Auth + Storage dalam satu platform, free tier memadai untuk MVP |
| CLI runtime | Node.js + TypeScript | Konsisten dengan stack web, dikompilasi dengan `tsup` |
| CLI interactive prompt | `@clack/prompts` | Tampilan modern, ringan |
| CLI process execution | `execa` | Menjalankan child process (git, composer) dengan lebih rapi dari `child_process` bawaan |
| AI/LLM | Groq API | Gratis dengan limit memadai, kecepatan tinggi |
| AI SDK | Vercel AI SDK | Streaming response untuk chatbot, integrasi native dengan Next.js |
| Repository template | GitHub (Organization) | Gratis, standar industri, mendukung `git clone` publik tanpa autentikasi |
| Package registry | npm | Gratis untuk package publik |
| Deployment web & API | Vercel | Dukungan native untuk monorepo Turborepo, gratis untuk skala MVP |

---

## 11. Model Data (Skema Dasar)

```
Table: templates
- id (uuid, primary key)
- slug (string, unique)              → contoh: "ecommerce-basic-nextjs"
- nama (string)                       → contoh: "E-commerce Basic"
- framework (string)                  → contoh: "nextjs"
- kategori (string)                   → contoh: "ecommerce"
- repo_url (string)
- deskripsi (text)
- screenshot_url (string)
- opsi_integrasi (array of string)    → contoh: ["supabase", "midtrans"]
- created_at (timestamp)
- updated_at (timestamp)
```

```
Table: integrasi (referensi untuk generate .env.example & SETUP.md)
- id (uuid, primary key)
- kode (string, unique)               → contoh: "supabase"
- nama_tampilan (string)              → contoh: "Supabase"
- daftar_env_var (array of string)    → contoh: ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY"]
- instruksi_setup (text/markdown)     → langkah-langkah setup untuk SETUP.md
```

---

## 12. API Endpoint (Kebutuhan Dasar)

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/api/templates` | Daftar semua template (untuk ditampilkan di web) |
| GET | `/api/templates/:slug` | Detail satu template berdasarkan slug (dipanggil oleh CLI) |
| POST | `/api/templates` | Menambah template baru (admin only) |
| PUT | `/api/templates/:slug` | Mengubah metadata template (admin only) |
| DELETE | `/api/templates/:slug` | Menghapus template (admin only) |
| POST | `/api/ai/recommend` | Menerima input natural language, mengembalikan rekomendasi slug template |
| POST | `/api/ai/chat` | Endpoint chatbot troubleshooting setup |

---

## 13. Metrik Keberhasilan (untuk Konteks Lomba)

- Demo end-to-end berjalan tanpa error: pilih template di web → generate command → project berhasil dibuat di terminal
- Minimal 2-3 kombinasi template yang benar-benar berfungsi dan terlihat profesional secara visual
- AI Recommendation Assistant memberikan rekomendasi yang relevan dan dapat dijelaskan alasannya
- Presentasi dapat menjelaskan dengan jelas batasan MVP dan roadmap pengembangan (kustomisasi penuh, marketplace, multi-framework) sebagai bagian dari visi produk

---

## 14. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Waktu pengembangan template (dengan tampilan visual jadi) memakan waktu lebih lama dari perkiraan | Batasi jumlah kombinasi di MVP menjadi 2-3 saja, prioritaskan kualitas dibanding kuantitas |
| AI recommendation memberikan saran yang tidak akurat/asal | Batasi AI untuk memilih dari daftar template yang sudah ada (bukan generate bebas), sertakan fallback ke pilihan manual |
| Ekspektasi juri terhadap "kustomisasi penuh" tidak terpenuhi | Jelaskan secara eksplisit dan jujur di presentasi bahwa ini adalah keputusan arsitektur sadar, dengan roadmap yang jelas |
| Nama produk/domain/package npm sudah dipakai pihak lain | Siapkan 2-3 alternatif nama sejak awal, cek ketersediaan sebelum development dimulai |

---

## 15. Lampiran

- Detail eksplorasi arsitektur kustomisasi penuh ("base template + modular injection") dan alasan penundaannya ke roadmap tersedia di dokumen referensi ide terpisah (`ide-ai-agent-lomba.md`, bagian ide starter kit generator).
- Detail langkah teknis (publish npm, membuat GitHub Organization, struktur file CLI) tersedia di dokumen yang sama.
