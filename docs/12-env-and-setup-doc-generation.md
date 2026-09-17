# 12 — Env & Setup Doc Generation

## Tujuan
Menjelaskan mekanisme generate otomatis file `.env.example` dan `SETUP.md` di dalam project hasil generate CLI, berdasarkan kombinasi integrasi yang dipilih user.

## Prinsip Dasar (Batasan Tanggung Jawab Tools)
Tools ini TIDAK melakukan provisioning akun/koneksi real ke service pihak ketiga (Supabase, Midtrans, dll). Tanggung jawab tools berhenti di dua hal:
1. Memberi tahu **variable apa saja** yang dibutuhkan (`.env.example`)
2. Memberi tahu **cara mendapatkan nilai variable itu** (`SETUP.md`)

User tetap harus membuat akun sendiri di service terkait dan mengisi nilai environment variable secara manual. Ini adalah praktik standar yang sama dengan seluruh tool scaffolding lain di industri (`create-next-app` juga tidak pernah membuatkan akun apapun untuk penggunanya).

## Sumber Data
Kedua file ini di-generate dari data yang tersimpan di tabel `integrasi` (lihat `03-database-architecture.md`), khususnya kolom `daftar_env_var` dan `instruksi_setup`.

## Arsitektur "Paket Modular per Integrasi"
Setiap integrasi (Supabase, Midtrans, Clerk, dll) adalah satu unit data independen yang berisi:
1. Daftar environment variable yang dibutuhkan
2. Potongan teks instruksi setup (dalam format markdown)

Saat user memilih beberapa integrasi sekaligus, sistem MENGGABUNGKAN potongan-potongan dari tiap integrasi yang dipilih menjadi satu file utuh. Ini membuat sistem scalable — menambah integrasi baru di masa depan (misalnya RajaOngkir) cukup dengan menambah satu baris data baru di tabel `integrasi`, tanpa mengubah logic penggabungan yang sudah ada.

## Proses Generate `.env.example`

Dilakukan oleh CLI (`packages/cli/src/lib/`) setelah proses clone berhasil, dengan langkah:
1. Ambil array `integrasi` (berisi objek lengkap, bukan hanya kode) dari response `GET /api/templates/:slug` yang sudah didapat sebelumnya (lihat `02-cli-architecture.md` dan `04-api-backend-architecture.md`) — TIDAK PERLU memanggil endpoint tambahan lagi, karena data sudah lengkap dalam satu response ini sejak awal.
2. Gabungkan `daftar_env_var` dari setiap objek integrasi menjadi satu list, tulis ke file `.env.example` di dalam folder project yang baru di-clone

**Catatan arsitektur:** Sebelumnya proses ini melibatkan pemanggilan `GET /api/integrasi/:kode` satu per satu untuk tiap integrasi (N+1 request). Ini sudah dioptimalkan — endpoint `GET /api/templates/:slug` kini langsung mengembalikan data integrasi lengkap dalam satu response, sehingga CLI cukup melakukan SATU kali pemanggilan API untuk mendapatkan seluruh data yang dibutuhkan.

**Contoh hasil akhir `.env.example`:**
```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Midtrans
MIDTRANS_SERVER_KEY=
MIDTRANS_CLIENT_KEY=
```

## Proses Generate `SETUP.md`

Sama seperti `.env.example`, tapi menggabungkan `instruksi_setup` (markdown) dari setiap objek integrasi (sudah tersedia di response yang sama) menjadi satu file panduan lengkap.

**Contoh hasil akhir `SETUP.md`:**
```markdown
# Panduan Setup Project

## Supabase
1. Buat akun di supabase.com
2. Buat project baru
3. Ambil URL & Anon Key di Settings > API
4. Paste ke .env.local kamu

## Midtrans
1. Daftar di midtrans.com (mode Sandbox untuk testing)
2. Ambil Server Key & Client Key di dashboard
3. Paste ke .env.local kamu
```

## Perbedaan dengan `.env.example` dan `README.md` yang Sudah Ada di Repo Template
Repo template itu sendiri sudah memiliki `.env.example` dasar (kosong, sesuai `08-template-best-practice-standard.md`) dan `README.md` (deskripsi template). File `.env.example` dan `SETUP.md` yang dijelaskan di dokumen ini adalah hasil **override/generate ulang** oleh CLI setelah clone, disesuaikan dengan kombinasi integrasi spesifik yang dipilih user saat itu — bukan file statis yang sama untuk semua orang.

**Urutan proses (lihat juga `02-cli-architecture.md`):**
1. Clone repo (berisi `.env.example` dasar dari template)
2. CLI OVERWRITE `.env.example` dengan versi yang sudah digabungkan sesuai integrasi yang dipilih
3. CLI membuat file baru `SETUP.md` (file ini tidak ada di repo template asli, murni hasil generate CLI)

## Aturan untuk Developer/AI Agent
- Format `daftar_env_var` di database HARUS konsisten: array of object dengan minimal field `key` dan `deskripsi` (lihat `03-database-architecture.md`).
- Instruksi setup (`instruksi_setup`) ditulis dalam format markdown murni, tanpa styling HTML tambahan, karena akan digabungkan langsung sebagai teks.
- Jangan pernah menambahkan nilai default/contoh yang terlihat seperti key asli (misalnya `MIDTRANS_SERVER_KEY=SB-Mid-xxx`) — biarkan benar-benar kosong untuk menghindari kebingungan atau risiko orang salah kira ini adalah key yang valid.

## Referensi Silang
- Struktur data integrasi: `03-database-architecture.md`
- Endpoint yang menyediakan data ini: `04-api-backend-architecture.md`
- Implementasi generate file di CLI: `02-cli-architecture.md`