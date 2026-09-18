# 04 — API Backend Architecture

## Lokasi Kode
`apps/web/app/api/` — menggunakan Next.js Route Handlers (App Router), bukan server terpisah. Backend dan frontend berada dalam satu aplikasi Next.js yang sama untuk MVP.

## Prinsip Desain
- API ini adalah satu-satunya cara CLI mengetahui `repo_url` dari sebuah `slug`. CLI TIDAK PERNAH mengakses database secara langsung.
- Endpoint publik (dipakai CLI dan web builder) tidak memerlukan autentikasi. Endpoint admin WAJIB memverifikasi sesi login admin.

## Daftar Endpoint

### `GET /api/templates/:slug`
**Fungsi:** Mengambil detail satu template berdasarkan slug. Endpoint INI YANG DIPANGGIL OLEH CLI.
**Response:** Menyertakan detail LENGKAP tiap integrasi (bukan hanya kode-nya) agar CLI tidak perlu melakukan request tambahan per integrasi (menghindari N+1 request — lihat catatan di `12-env-and-setup-doc-generation.md`).
```json
{
  "slug": "ecommerce-supabase-midtrans-nextjs",
  "repo_url": "https://github.com/username/ecommerce-supabase-midtrans-nextjs.git",
  "framework": "nextjs",
  "integrasi": [
    {
      "kode": "supabase",
      "nama_tampilan": "Supabase",
      "daftar_env_var": [
        {"key": "NEXT_PUBLIC_SUPABASE_URL", "deskripsi": "URL project Supabase"},
        {"key": "NEXT_PUBLIC_SUPABASE_ANON_KEY", "deskripsi": "Anon key dari Settings > API"}
      ],
      "instruksi_setup": "## Supabase\n1. Buat akun di supabase.com\n..."
    },
    {
      "kode": "midtrans",
      "nama_tampilan": "Midtrans",
      "daftar_env_var": [
        {"key": "MIDTRANS_SERVER_KEY", "deskripsi": "Server key dari dashboard Midtrans"},
        {"key": "MIDTRANS_CLIENT_KEY", "deskripsi": "Client key dari dashboard Midtrans"}
      ],
      "instruksi_setup": "## Midtrans\n1. Daftar di midtrans.com...\n..."
    }
  ]
}
```
**Implementasi server:** Endpoint ini melakukan JOIN/lookup ke tabel `integrasi` berdasarkan `opsi_integrasi` milik template SEBELUM mengembalikan response, sehingga seluruh data yang dibutuhkan CLI (termasuk untuk generate `.env.example` dan `SETUP.md`) tersedia dalam SATU kali response.
**Error case:** Jika slug tidak ditemukan atau `is_published = false`, kembalikan `404` dengan body `{ "error": "Template tidak ditemukan" }`. CLI harus menampilkan pesan ini apa adanya ke user.

### `GET /api/templates`
**Fungsi:** Mengambil daftar semua template yang `is_published = true`. Dipanggil oleh WEB (halaman builder) DAN oleh CLI (untuk interactive prompt saat dijalankan tanpa parameter `--template`, lihat `02-cli-architecture.md`). Endpoint ini bersifat publik, tidak memerlukan autentikasi.
**Query params opsional:** `?kategori=ecommerce&framework=nextjs`
**Response:**
```json
{
  "templates": [
    {
      "slug": "ecommerce-basic-nextjs",
      "nama": "E-commerce Basic",
      "framework": "nextjs",
      "kategori": "ecommerce",
      "deskripsi": "...",
      "screenshot_url": "...",
      "opsi_integrasi": []
    }
  ]
}
```

### `GET /api/integrasi/:kode`
**Fungsi:** Mengambil detail satu integrasi. Endpoint ini dipakai oleh ADMIN PANEL (misalnya untuk menampilkan preview instruksi setup saat admin menyusun template baru), BUKAN oleh CLI — CLI mendapatkan data integrasi lengkap langsung dari `GET /api/templates/:slug` dalam satu response (lihat di atas), untuk menghindari N+1 request.
**Response:**
```json
{
  "kode": "supabase",
  "nama_tampilan": "Supabase",
  "daftar_env_var": [
    {"key": "NEXT_PUBLIC_SUPABASE_URL", "deskripsi": "URL project Supabase"},
    {"key": "NEXT_PUBLIC_SUPABASE_ANON_KEY", "deskripsi": "Anon key dari Settings > API"}
  ],
  "instruksi_setup": "## Supabase\n1. Buat akun di supabase.com\n..."
}
```

### `POST /api/templates` (Admin Only)
**Fungsi:** Menambah template baru.
**Autentikasi:** Wajib session admin valid (lihat `06-admin-panel-architecture.md`).
**Body:**
```json
{
  "nama": "E-commerce Basic",
  "framework": "nextjs",
  "kategori": "ecommerce",
  "repo_url": "https://github.com/username/ecommerce-basic-nextjs.git",
  "deskripsi": "...",
  "screenshot_url": "...",
  "opsi_integrasi": []
}
```
**Proses:** Slug di-generate otomatis dari `nama` + `framework` (lowercase, spasi jadi dash) kecuali admin override manual. Validasi slug harus unique sebelum insert ke database.

### `PUT /api/templates/:slug` (Admin Only)
Mengubah metadata template yang sudah ada. Body sama seperti POST, slug pada URL tidak berubah kecuali field slug baru disertakan secara eksplisit.

### `DELETE /api/templates/:slug` (Admin Only)
Menghapus/unpublish template. Rekomendasi: soft-delete (set `is_published = false`) daripada hard-delete, agar histori tetap ada.

### `POST /api/ai/recommend`
**Fungsi:** Menerima input bahasa natural dari user, mengembalikan rekomendasi slug template yang relevan dari data yang ada di database (BUKAN generate template baru).
**Body:** `{ "pertanyaan": "mau bikin toko baju kecil-kecilan, budget minim" }`
**Response:**
```json
{
  "rekomendasi": [
    {
      "slug": "ecommerce-supabase-midtrans-nextjs",
      "alasan": "Supabase gratis untuk skala kecil, Midtrans mendukung banyak metode bayar lokal."
    }
  ]
}
```
**Detail implementasi:** lihat `13-ai-recommendation-assistant.md`.

### `POST /api/ai/chat`
**Fungsi:** Chatbot troubleshooting setup.
**Body:** `{ "pesan": "kenapa muncul error composer not found", "riwayat": [...] }`
**Detail implementasi:** lihat `14-ai-setup-chatbot.md`.

## Autentikasi Admin
Menggunakan Supabase Auth (email/password untuk MVP). Setiap endpoint admin (`POST`, `PUT`, `DELETE` pada `/api/templates`) WAJIB memvalidasi session di server-side sebelum memproses request. Gunakan middleware Next.js untuk memeriksa session sebelum request masuk ke handler.

## Format Error Standar
Semua endpoint mengembalikan format error yang konsisten:
```json
{ "error": "Pesan error yang jelas dalam Bahasa Indonesia" }
```
dengan HTTP status code yang sesuai (400 untuk bad request, 401 untuk unauthenticated, 404 untuk not found, 500 untuk server error).

## Referensi Silang
- Skema data yang mendasari endpoint ini: `03-database-architecture.md`
- Cara CLI memanggil endpoint ini: `02-cli-architecture.md`
- Cara admin panel memanggil endpoint POST/PUT/DELETE: `06-admin-panel-architecture.md`