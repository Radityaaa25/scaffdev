# 17 — Roadmap: Custom Combination Engine (BELUM DIIMPLEMENTASIKAN DI MVP)

## Status
**TIDAK ADA DI MVP.** File ini murni dokumentasi arsitektur yang sudah dipikirkan matang, disimpan untuk pengembangan di fase berikutnya (kemungkinan sebagai fitur premium/berlangganan). JANGAN mengimplementasikan ini kecuali sudah ada keputusan eksplisit untuk melanjutkan ke fase ini.

## Masalah yang Melatarbelakangi
Di MVP, user hanya bisa memilih dari kombinasi template yang sudah dibuat sebelumnya (`ecommerce-basic-nextjs`, `ecommerce-supabase-midtrans-nextjs`, dst — lihat pendekatan "Kombinasi Terbatas" di `PRD-scaffolding-tool.md` bagian 9.1). User TIDAK BISA memilih bebas, misalnya "Next.js + Firebase (bukan Supabase) + Xendit (bukan Midtrans)" jika kombinasi itu belum pernah dibuat sebagai template pre-built.

Alasan kenapa ini tidak sederhana: jika setiap kombinasi dibuat sebagai repo terpisah, jumlah kombinasi yang mungkin meningkat secara eksponensial (2 pilihan database × 2 pilihan payment × 2 pilihan auth = 8 repo, dan akan terus bertambah seiring makin banyak opsi ditambahkan).

## Konsep Arsitektur yang Sudah Dirancang: "Base Template + Modular Injection"

### 1. Base Template (Repo Utama)
Satu repo berisi struktur project dasar TANPA integrasi apapun. Bagian kode yang membutuhkan integrasi (misalnya fungsi login, fungsi proses pembayaran) dibiarkan sebagai placeholder dengan marker khusus, contoh:
```ts
// {{INJECT_PAYMENT_IMPORT}}

export function checkout() {
  // {{INJECT_PAYMENT_LOGIC}}
}
```

### 2. "Paket" per Opsi Integrasi (Terpisah dari Base Template)
Setiap opsi (Supabase, Firebase, Midtrans, Xendit, dll) disimpan sebagai potongan kode terpisah, BUKAN project utuh, berisi:
- File-file spesifik yang perlu ditambahkan ke dalam project (mis. `lib/midtrans.ts`)
- Definisi "sisipan" — potongan kode yang harus ditempatkan pada marker tertentu di base template (mis. isi yang menggantikan `{{INJECT_PAYMENT_LOGIC}}`)

### 3. Proses "Assembly" oleh CLI
Saat CLI dijalankan dengan parameter kombinasi bebas (contoh konsep: `--db=firebase --payment=xendit`):
1. Clone base template ke folder project user
2. Untuk setiap opsi yang dipilih, ambil paket terkait, salin file-file spesifiknya ke folder yang sesuai
3. Cari marker (`{{INJECT_...}}`) di file-file base template, ganti dengan kode sisipan dari paket yang dipilih
4. Gabungkan seluruh dependency dari base + setiap paket ke dalam satu `package.json` final
5. Lanjutkan proses generate `.env.example` dan `SETUP.md` seperti biasa (lihat `12-env-and-setup-doc-generation.md`), namun sumber datanya sekarang dari kombinasi bebas, bukan template pre-built tunggal

## Kenapa Ini Ditunda dari MVP
1. Proses "sisip kode otomatis" memerlukan jaminan bahwa hasil gabungan kode SELALU valid secara sintaks dan logika untuk SEMUA kemungkinan kombinasi — ini sulit dijamin dalam waktu pengembangan terbatas tanpa testing menyeluruh di setiap kombinasi.
2. Risiko menghasilkan kode yang error atau tidak sesuai best practice jika marker/sisipan tidak dirancang dengan sangat hati-hati untuk setiap kemungkinan kombinasi integrasi.
3. Nilai fitur ini lebih cocok dijual sebagai tingkatan produk yang lebih tinggi (berlangganan) karena effort pengembangannya jauh lebih besar dibanding template pre-built biasa.

## Prasyarat Sebelum Melanjutkan ke Fase Ini
- Sistem autentikasi/login user (belum ada di MVP)
- Sistem berlangganan/pembayaran untuk membuka fitur ini (belum dirancang, masih berupa gagasan awal)
- Testing menyeluruh terhadap kombinasi marker injection untuk setidaknya kombinasi-kombinasi yang paling umum digunakan

## Referensi Silang
- Pendekatan yang DIPAKAI di MVP sebagai gantinya: `07-template-slug-system.md`, `08-template-best-practice-standard.md`
- Konteks keputusan produk lengkap: `PRD-scaffolding-tool.md`, bagian 9.1
