# Spesifikasi Manifest Modul Integrasi (`scaff.integration.json`)

> Status: **kontrak Fase 0 Builder**. CLI 0.1.x MENGABAIKAN file ini.
> Mulai dipakai CLI 0.2.0 (flag `--with=`).

Setiap repo modul integrasi (didaftarkan via `repo_url` di tabel `integrasi`)
**wajib** memuat file `scaff.integration.json` di root repo. CLI Builder
membacanya untuk menyuntikkan modul ke template base secara deterministik —
tanpa menebak struktur repo.

## Layout repo modul (multi-framework)

Satu repo per layanan, berisi subfolder per framework:

```
scaff-modul-midtrans/
├── scaff.integration.json
├── REMOVE-TEMPLATE.md
├── nextjs/                  ← sumber bila base Next.js
│   ├── lib/payments/midtrans.ts
│   └── app/api/payments/midtrans/route.ts
└── laravel/                 ← sumber bila base Laravel
    ├── app/Services/MidtransService.php
    └── app/Http/Controllers/MidtransController.php
```

Aturan resolusi sumber oleh CLI: framework base `F` → basis sumber
`{repo}/F/` bila folder ada; bila tidak ada, basis = root repo (modul
single-framework). Semua `src` di manifest relatif terhadap basis sumber
tersebut. Manifest TETAP satu di root (tidak boleh ada manifest per subfolder).

## Contoh minimal

```json
{
  "kode": "midtrans",
  "version": "1.0.0",
  "frameworks": ["nextjs"],
  "files": [
    { "src": "lib/midtrans.ts", "dest": "lib/payments/midtrans.ts" },
    { "src": "app/api/midtrans/route.ts", "dest": "app/api/payments/midtrans/route.ts" }
  ],
  "dependencies": {
    "npm": { "midtrans-client": "^1.4.0" }
  },
  "env": ["MIDTRANS_SERVER_KEY", "NEXT_PUBLIC_MIDTRANS_CLIENT_KEY"],
  "setup": "SETUP-FRAGMENT.md",
  "removal": {
    "files": ["lib/payments/midtrans.ts", "app/api/payments/midtrans/route.ts"],
    "env": ["MIDTRANS_SERVER_KEY", "NEXT_PUBLIC_MIDTRANS_CLIENT_KEY"],
    "stepsFile": "REMOVE.md"
  },
  "conflicts": ["xendit"]
}
```

## Referensi field

| Field | Wajib | Isi |
|---|---|---|
| `kode` | Ya | Sama dengan `kode` di tabel `integrasi` (huruf kecil, dash). |
| `version` | Ya | Semver modul (`1.0.0`). CLI menolak versi tak terbaca. |
| `frameworks` | Ya | Daftar kode framework yang didukung modul. Harus subset dari `framework_compat` di database; kosong = semua. |
| `files[]` | Ya, min 1 | Pasangan `src` (relatif basis sumber = `{repo}/{framework}/` bila ada, else root) → `dest` (relatif root template base). `dest` dilarang keluar root (`..`) dan dilarang menimpa file bawaan base — tabrakan = generate GAGAL eksplisit. |
| `dependencies.npm` / `.composer` | Tidak | Map nama → range versi, di-merge ke `package.json`/`composer.json` base. Konflik range tak terdamaikan = GAGAL eksplisit. |
| `env` | Tidak | Daftar key yang dipakai modul. Harus subset dari `daftar_env_var` di database (sumber kebenaran tetap DB). |
| `setup` | Tidak | Path file markdown di repo modul, digabung ke `SETUP.md` hasil racikan setelah fragmen bawaan. |
| `removal` | **Ya bila kategori payment/database/auth/shipping** | Panduan copot untuk skenario "double se-kategori": `files` + `env` milik modul + `stepsFile` (markdown langkah hapus manual). CLI men-generate section "Cara mencopot X" otomatis dari sini. |
| `conflicts[]` | Tidak | Daftar `kode` integrasi yang tidak disarankan bareng (mis. `midtrans` vs `xendit`). CLI meminta konfirmasi eksplisit, bukan menolak. |

## Aturan main CLI (ringkas, detail implementasi di Fase 1)

1. Clone base → baca `scaff.template.json` base (bila ada) → clone tiap modul ke temp → validasi manifest (kode cocok, framework base didukung, versi terbaca).
2. **Cek konsistensi runtime** (wajib, setiap eksekusi — repo bisa berubah setelah didaftarkan): semua `src` manifest harus ada di hasil clone; `removal.files` modul harus subset dari file yang modul itu pasang; `provides` base harus ada di hasil clone base. Meleset = ABORT sebelum menyentuh apa pun.
3. Salin `files` satu per satu; tabrakan path = GAGAL dengan pesan file-nya (tanpa timpa diam-diam).
4. Merge dependency + gabung env/SETUP dari database (sumber kebenaran tetap DB, bukan manifest).
5. Double se-kategori (mis. base sudah Midtrans + user pilih Xendit): minta konfirmasi eksplisit, lalu sertakan panduan `removal` di `SETUP.md`.
6. Kategori `other`: boleh multi. Provider sosial (Google/GitHub login): sub-pilihan dalam modul auth, bukan modul sendiri.
7. **Backup + restore otomatis:** sebelum menghapus file apa pun (skenario copot), CLI menyalin target ke `.scaff/trash/` + mencatat hash di `.scaff/receipt.json`. Setelah hapus → verifikasi (`npm run build` / `composer install` kering + grep 0 sisa). Gagal verifikasi → **restore otomatis + batalkan operasi**. Backup adalah jaring pengaman, bukan izin untuk manifest ceroboh.
8. **Hanya hapus yang terbukti milik + tak berubah:** file yang hash-nya beda dari receipt (sudah diedit user) TIDAK dihapus otomatis — dialihkan ke panduan manual. Heuristic-delete (menebak dari nama/konten) DILARANG di level kode: tidak ada path eksekusi yang menghapus file tanpa bukti manifest + cek kepemilikan.

## Validasi `scaffdev validate-module` (cek statis, Fase 1)

Selain cek struktur, validator membangun **graf import** sederhana (import/require/use per file) dan **memperingatkan** bila file di `provides`/`removal.files` diimpor oleh file di luar daftar tersebut (indikasi file shared yang salah klaim). Peringatan = pendaftaran ditahan sampai author memperbaiki atau menandai eksplisit dengan alasan.

## Checklist pembuat modul

- [ ] `scaff.integration.json` valid (CLI menyediakan `scaffdev validate-module` di 0.2.0).
- [ ] Semua `src` ada di repo; semua `dest` relatif dan tidak menimpa file base populer (`package.json`, `.env.example`, `README.md` dilarang sebagai `dest`).
- [ ] `SETUP-FRAGMENT.md` + `REMOVE.md` (bila wajib) jelas untuk pemula.
- [ ] Test suntik ke minimal 1 template base per framework yang didukung.
