# 03 — Database Architecture

## Platform
Supabase (Postgres). Dipilih karena menyediakan database + auth + storage dalam satu platform, free tier cukup untuk kebutuhan MVP.

## Prinsip Penting
Database ini HANYA menyimpan **metadata** template (slug, url repo, deskripsi, dll) — TIDAK PERNAH menyimpan isi kode/file template itu sendiri. Isi kode template selalu berada di GitHub, database hanya menyimpan referensi ke sana.

## Skema Tabel

### Tabel `templates`
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid, primary key | |
| `slug` | text, unique, not null | Contoh: `ecommerce-basic-nextjs`. Dipakai di command CLI (`--template=slug`). Harus URL-safe (huruf kecil, angka, dash). |
| `nama` | text, not null | Nama tampilan, contoh: "E-commerce Basic" |
| `framework` | text, not null | Contoh: `nextjs`, `laravel` |
| `kategori` | text, not null | Contoh: `ecommerce`, `landing-page`, `portfolio` |
| `repo_url` | text, not null | URL GitHub, contoh: `https://github.com/username/ecommerce-basic-nextjs.git`. HARUS repo public untuk MVP. |
| `deskripsi` | text | |
| `screenshot_url` | text | Untuk preview visual di web |
| `opsi_integrasi` | text[] (array) | Contoh: `['supabase', 'midtrans']`. Kosong array jika template basic tanpa integrasi. Merujuk ke `kode` di tabel `integrasi`. |
| `is_published` | boolean, default false | Kontrol apakah template tampil di web/bisa diakses CLI. Admin bisa simpan draft tanpa langsung publish. |
| `downloads_count` | integer, default 0 | Jumlah project di-generate via CLI (naik tiap `GET /api/templates/:slug?source=cli`). Ditambah via RPC `increment_template_downloads`, bukan write langsung. |
| `created_at` | timestamptz, default now() | |
| `updated_at` | timestamptz, default now() | |

### Tabel `integrasi`
Tabel referensi yang dipakai untuk menggabungkan `.env.example` dan `SETUP.md` secara dinamis (lihat `12-env-and-setup-doc-generation.md`).

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid, primary key | |
| `kode` | text, unique, not null | Contoh: `supabase`, `midtrans`. Ini yang dirujuk dari `templates.opsi_integrasi`. |
| `nama_tampilan` | text, not null | Contoh: "Supabase" |
| `kategori_integrasi` | text | Contoh: `database`, `payment`, `auth` — untuk pengelompokan di UI |
| `daftar_env_var` | jsonb | Array of object, contoh: `[{"key": "NEXT_PUBLIC_SUPABASE_URL", "deskripsi": "URL project Supabase"}]` |
| `instruksi_setup` | text (markdown) | Konten yang akan digabungkan ke `SETUP.md`, ditulis dalam format markdown |
| `created_at` | timestamptz, default now() | |

### Tabel `admin_users` (Autentikasi Admin Panel)
| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid, primary key | Menggunakan Supabase Auth bawaan, tabel ini bisa berupa extension dari `auth.users` |
| `email` | text, unique | |
| `role` | text, default 'admin' | Untuk MVP hanya ada satu role, disiapkan untuk ekspansi role di masa depan |

## Relasi
- `templates.opsi_integrasi` (array of text) merujuk ke `integrasi.kode` secara logis (BUKAN foreign key relasional array-to-scalar di Postgres — validasi kecocokan kode dilakukan di level aplikasi/API, bukan constraint database).

## Indexing yang Direkomendasikan
```sql
CREATE UNIQUE INDEX idx_templates_slug ON templates(slug);
CREATE INDEX idx_templates_kategori ON templates(kategori);
CREATE INDEX idx_templates_framework ON templates(framework);
CREATE INDEX idx_templates_published ON templates(is_published);
```

## Row Level Security (RLS)
- Tabel `templates` dan `integrasi`: **read public** untuk baris dengan `is_published = true` (diakses oleh web publik dan CLI tanpa autentikasi). **Write hanya untuk admin_users** yang terautentikasi.
- Tabel `admin_users`: hanya bisa diakses oleh service role (backend), tidak ada akses publik.

## Aturan untuk Developer/AI Agent
- Setiap kali menambah kolom baru ke tabel `templates` atau `integrasi`, WAJIB update juga dokumen ini dan `04-api-backend-architecture.md` supaya tetap sinkron.
- Jangan pernah menyimpan API key/secret milik user di tabel manapun di database ini — database ini murni metadata template, bukan tempat penyimpanan credential user.

## Referensi Silang
- Cara data ini dikonsumsi API: `04-api-backend-architecture.md`
- Cara data ini digunakan CLI untuk generate `.env.example`/`SETUP.md`: `12-env-and-setup-doc-generation.md`
- Cara admin mengisi data ini: `06-admin-panel-architecture.md`
