# 15 — Security Guidelines

## Tujuan
Kumpulan aturan keamanan wajib yang berlaku di seluruh bagian proyek (web, CLI, template, admin panel). File ini adalah rujukan tunggal untuk pertanyaan "apakah ini aman dilakukan?" — jika ragu, kembali ke file ini.

## Prinsip Utama
Proyek ini secara sadar TIDAK mengklaim menyediakan penyimpanan credential/secret yang aman untuk data production sensitif. Tools ini adalah scaffolding generator, bukan secret manager. Batasan ini harus dikomunikasikan jujur ke user, bukan disamarkan.

## Aturan Wajib — Kode & Repository
1. File `.env` (isi asli) TIDAK PERNAH boleh masuk ke repository manapun (template maupun kode proyek utama). Hanya `.env.example` (placeholder kosong) yang boleh ada.
2. `.gitignore` di SETIAP repo (baik `packages/cli`, `apps/web`, maupun tiap repo template) wajib menyertakan: `.env`, `.env.local`, `node_modules`, `.next`, `dist`.
3. Tidak boleh ada API key, token, atau credential apapun ter-hardcode di kode manapun, di layer manapun (frontend, backend, CLI, template).
4. Jika secret pernah tidak sengaja ter-commit ke riwayat git (walau sudah di-revert di commit berikutnya), anggap secret tersebut BOCOR — credential asli harus segera di-rotate oleh pemiliknya, karena riwayat git tetap bisa diakses.

## Aturan Wajib — Autentikasi & Akses
1. Semua endpoint yang melakukan perubahan data (`POST`, `PUT`, `DELETE` pada `/api/templates`) WAJIB memvalidasi session admin di sisi server sebelum memproses request (lihat `04-api-backend-architecture.md` dan `06-admin-panel-architecture.md`).
2. Supabase Service Role Key TIDAK BOLEH pernah diekspos ke kode sisi client (browser). Semua operasi yang membutuhkan service role harus dilakukan di server (API Route).
3. 2FA WAJIB diaktifkan di akun GitHub pribadi setiap anggota tim yang memiliki akses ke GitHub Organization (lihat `10-github-repo-management.md`).

## Aturan Wajib — AI Features
1. AI (LLM) TIDAK PERNAH diizinkan men-generate kode integrasi security-critical (payment, auth, database credential) secara real-time untuk langsung dipakai user. Lihat penjelasan lengkap di `13-ai-recommendation-assistant.md`.
2. Setiap output AI yang merujuk ke data sistem (misalnya slug template) WAJIB divalidasi terhadap data asli sebelum ditampilkan ke user, untuk mencegah halusinasi LLM ditampilkan sebagai fakta.

## Batasan yang Harus Dikomunikasikan ke User (Bukan Disembunyikan)
- Tools ini TIDAK membuatkan akun di service pihak ketiga (Supabase, Midtrans, dll) untuk user.
- Tools ini TIDAK menyimpan credential/API key milik user di manapun dalam sistem — semua environment variable diisi manual oleh user sendiri di komputer mereka (lihat `12-env-and-setup-doc-generation.md`).
- Repo template bersifat PUBLIC di tahap MVP — siapa saja bisa melihat isi kode template (lihat `10-github-repo-management.md`).

## Hal yang SUDAH DIPUTUSKAN TIDAK Dibangun di MVP (Terkait Keamanan)
Sebagai catatan histori keputusan, ide-ide berikut sempat dipertimbangkan namun DITOLAK/DITUNDA karena risiko keamanan atau kompleksitas yang tidak sepadan untuk skala MVP:
- **Secret manager terintegrasi** (fitur untuk menyimpan & berbagi API key antar anggota tim secara aman) — ditolak sepenuhnya sebagai bagian dari produk ini karena pasarnya sudah sangat kompetitif (ada 1Password, Doppler, Infisical, HashiCorp Vault) dan kompleksitas implementasi zero-knowledge encryption tidak sepadan untuk MVP.
- **Kustomisasi bebas kombinasi integrasi** (arsitektur "puzzle"/modular code injection) — ditunda ke roadmap karena kompleksitas menjamin keamanan/kebenaran hasil sisipan kode otomatis. Detail lihat `17-roadmap-custom-combination-engine.md`.

## Checklist Keamanan Sebelum Rilis/Demo
- [ ] Tidak ada secret di repository manapun (cek dengan tools seperti `git-secrets` atau pemeriksaan manual sebelum push)
- [ ] Semua endpoint admin sudah diverifikasi memerlukan autentikasi
- [ ] 2FA aktif di akun GitHub Organization
- [ ] `.env.example` di setiap template tidak berisi nilai yang menyerupai key asli

## Referensi Silang
- Detail pengelolaan repo: `10-github-repo-management.md`
- Detail batasan AI: `13-ai-recommendation-assistant.md`, `14-ai-setup-chatbot.md`
- Detail arsitektur yang ditunda: `17-roadmap-custom-combination-engine.md`
