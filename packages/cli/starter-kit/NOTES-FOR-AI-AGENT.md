# CATATAN WAJIB BACA — untuk AI agent pengisi manifest template (v2)

> Kamu sedang mengisi manifest Scaffdev Builder. File yang kamu hasilkan adalah
> **satu-satunya bukti** yang dipercaya CLI untuk menghapus file. Salah isi =
> CLI menghapus file yang salah (atau menolak yang benar). Bekerja pelan,
> verifikasi setiap klaim ke isi repo. **Dilarang menebak.**
>
> ATURAN MEMBACA: baca SELURUH file ini sampai habis DULU sebelum bertindak.
> Jangan mulai dari tengah. Setiap BAGIAN punya gerbang yang harus lolos
> sebelum lanjut ke bagian berikutnya.

## BAGIAN 0 — PRASYARAT MUTLAK (berhenti bila tidak terpenuhi)

1. Kamu WAJIB punya akses baca ke **repo template** (bukan folder handover ini).
   Folder handover hanya berisi instruksi + contoh — TIDAK ADA kode template di sini.
2. Hal pertama yang kamu lakukan: tampilkan daftar file repo template
   (`git ls-files` bila repo git, atau struktur folder bila bukan).
   **Bila kamu tidak bisa melihat file repo template, BERHENTI dan katakan:**
   `"Saya tidak bisa melihat isi repo template. Berikan akses/clone repo-nya dulu."`
   Jangan lanjut dengan menebak isi repo.
3. Tugasmu HANYA DUA FILE (tidak lebih):
   - (a) `scaff.template.json` di root repo template, dan
   - (b) file `REMOVE-<KODE>.md` — SATU per integrasi yang TERBUKTI ada di repo.
   DILARANG: membuat kode integrasi, folder modul (`nextjs/`, `laravel/`),
   file `scaff.integration.json`, menambah dependency, atau mengubah kode template.

## BAGIAN 1 — PAHAMI DULU (jawab dalam hati sebelum lanjut)

- `provides` = peta "file X 100% milik integrasi Y". CLI memakai peta ini
  untuk MENGHAPUS file — satu baris salah = project user rusak.
- Kriteria file boleh masuk `provides` (lolos SEMUA, tanpa kecuali):
  a. file tidak diimpor/dipakai kode di luar integrasi itu (CEK IMPORT-nya!),
  b. menghapus file tidak merusak fitur inti template,
  c. file BUKAN config/shared (types bersama, router umum, layout, env example).
- Template polosan (TIDAK ADA integrasi bawaan sama sekali):
  `"provides": {}` + `"removalGuides": {}`. Itu jawaban BENAR dan SELESAI —
  jangan mengarang integrasi agar terlihat kerja, jangan buat file REMOVE apa pun.
- Kode integrasi HANYA dari daftar ini (persis, huruf kecil):
  `supabase, midtrans, xendit, rajaongkir, duitku, fonnte, cloudinary, resend`.
  Kode lain = tolak, tanyakan ke user.

## BAGIAN 2 — PETAKAN DULU, TULIS BELAKANGAN (gerbang wajib)

1. Jelajahi SELURUH repo template. Setiap file tentukan pemiliknya:
   `inti` (fitur umum template) atau salah satu kode integrasi di atas.
2. **WAJIB tampilkan tabel ini ke user dan TUNGGU konfirmasi sebelum lanjut:**

   | File | Pemilik (inti / kode) | Bukti 1 baris |
   |---|---|---|
   | `lib/payments/midtrans.ts` | midtrans | hanya diimpor `app/api/payments/midtrans/route.ts` |
   | `components/checkout/CheckoutForm.tsx` | inti | dipakai semua payment + merender form umum |

   Klaim tanpa kutipan bukti (baris import / hasil grep) = belum terverifikasi.
3. Kasus ambigu (SERING TERJADI): file dipakai integrasi SEKALIGUS inti
   (mis. form checkout memanggil tombol Midtrans TAPI juga merender form umum)
   → pemilik = **inti**, JANGAN masuk `provides`. Tulis di tabel dengan
   keterangan "ambigu → inti".
4. **JANGAN tulis file apa pun sebelum user menyetujui tabel ini.**
   Bila user belum menjawab, berhenti dan tunggu — jangan lanjut sendiri.

## BAGIAN 3 — TULIS `scaff.template.json` (hanya setelah tabel disetujui)

Isi `name`, `slug`, `framework` (`nextjs` | `laravel`) sesuai repo.
Lalu `provides` + `removalGuides` persis dari tabel yang disetujui.

Contoh A — template POLOSAN (tidak ada integrasi, mis. landing page):

```json
{
  "name": "Landing Startup",
  "slug": "landing-startup-nextjs",
  "framework": "nextjs",
  "provides": {},
  "removalGuides": {}
}
```

Contoh B — template berisi Midtrans + Supabase:

```json
{
  "name": "Ecommerce Basic",
  "slug": "ecommerce-basic-nextjs",
  "framework": "nextjs",
  "provides": {
    "midtrans": [
      "lib/payments/midtrans.ts",
      "app/api/payments/midtrans/route.ts",
      "components/checkout/MidtransButton.tsx"
    ],
    "supabase": [
      "lib/supabase.ts",
      "lib/auth.ts"
    ]
  },
  "removalGuides": {
    "midtrans": "REMOVE-MIDTRANS.md",
    "supabase": "REMOVE-SUPABASE.md"
  }
}
```

DILARANG mengembalikan file contoh di folder handover tanpa perubahan
(nama `GANTI-NAMA-TEMPLATE` / slug `ganti-slug-template-nextjs` tidak boleh
muncul di hasil final — itu placeholder contoh, bukan jawaban).

## BAGIAN 4 — TULIS `REMOVE-<KODE>.md` (satu per key di provides)

1. Copy `REMOVE-TEMPLATE.md` → rename `REMOVE-<KODE>.md` (kode huruf kecil).
   Bila `provides` kosong (Contoh A): LEWATI bagian ini sepenuhnya.
2. Isi SEMUA bagian bertanda ✏️, lalu hapus baris instruksi template.
   Setiap file WAJIB 2 section (Next.js dan Laravel); section yang tidak
   relevan diisi "Tidak berlaku untuk template ini" + alasannya.
3. Isi wajib: aturan emas → daftar file + perintah hapus → env → uninstall
   dependency → verifikasi (build + grep 0 sisa) → "Yang JANGAN dihapus".

## BAGIAN 5 — VERIFIKASI MANDIRI + LAPORAN (wajib, tidak bisa dilewat)

Laporkan per poin LULUS/GAGAL + metode (dilihat langsung / grep / build):
- (a) Setiap path di `provides` benar-benar ada di repo (cek satu per satu).
- (b) Tidak ada file inti template yang masuk ke `provides`.
- (c) Setiap `REMOVE-*.md` menyebut file yang SAMA PERSIS dengan `provides`
      (tidak lebih, tidak kurang — kecuali perintah verifikasi).
- (d) Env di REMOVE cocok dengan yang dibaca kode (`process.env.*` / `env(...)`).
- (e) Setiap file di `provides` lolos kriteria 1a–1c (sebutkan bukti import-nya).
- (f) Checklist di `REMOVE-TEMPLATE.md` lolos semua (termasuk uji grep
      menemukan file SEBELUM dihapus).
- (g) Tidak ada tanda ✏️ yang tersisa + tidak ada placeholder contoh
      (`GANTI-`, `ganti-slug-`) yang tersisa di file final.

Format laporan akhir ke user:
1. Tabel BAGIAN 2 yang sudah disetujui (final, tanpa perubahan diam-diam).
2. Isi lengkap `scaff.template.json` + daftar `REMOVE-*.md` yang dibuat
   (atau pernyataan "template polosan — tidak ada file REMOVE").
3. Hasil verifikasi (a)–(g).
4. Daftar hal yang kamu TIDAK yakin (bila ada) — jujur lebih baik dari rapi tapi salah.

## LARANGAN KERAS (pelanggaran = hasil ditolak total)

- ❌ Bekerja tanpa melihat isi repo template (hanya dari folder handover).
- ❌ Menebak pemilik file ("kayaknya ini milik midtrans").
- ❌ Memasukkan file shared (types/router/layout/env/config) ke `provides`.
- ❌ Mengarang path yang tidak ada di repo.
- ❌ Mengembalikan file contoh tanpa perubahan nyata.
- ❌ Menulis file SEBELUM tabel BAGIAN 2 disetujui user.
- ❌ Menghapus atau mengubah makna section "Yang JANGAN dihapus".

## KENAPA ATURAN INI KETAT (baca bila tergoda melonggarkan)

CLI Builder menghapus file berdasarkan manifest-mu. Satu klaim salah =
satu dari dua: (1) file inti ikut terhapus → project user rusak, atau
(2) file yatim tertinggal → verifikasi grep gagal → user bingung.
Itulah kenapa ada backup/restore otomatis di CLI — tapi backup adalah
JARING PENGAMAN, bukan izin untuk ceroboh. Manifest yang benar membuat
backup tidak pernah terpakai.
