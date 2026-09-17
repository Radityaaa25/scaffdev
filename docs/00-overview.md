# 00 — Overview Produk

## Apa Ini
Platform web + CLI untuk generate project boilerplate (E-commerce, Landing Page, dll) yang SUDAH punya tampilan visual jadi (bukan folder kosong), dengan struktur folder mengikuti best practice, dan kurasi integrasi untuk konteks Indonesia (Midtrans, Xendit, RajaOngkir sebagai opsi/dokumentasi, bukan Stripe generic).

## Masalah yang Diselesaikan
Developer yang mau mulai project baru harus setup dari nol: struktur folder, config awal, integrasi database/auth/payment satu-satu dari dokumentasi berbeda-beda. Ini repetitif dan makan waktu, terutama untuk kombinasi yang sudah umum dipakai berulang kali (mis. Next.js + Supabase + Midtrans untuk e-commerce).

## Diferensiasi dari Kompetitor
| Kompetitor | Kelemahan | Produk Ini |
|---|---|---|
| `create-next-app`, `create-vite` | CLI-only, struktur minimal/kosong | Web visual + CLI, struktur sudah ada tampilan jadi |
| AppGen, AppForge | CLI-first, generic | Preview visual, kurasi lokal Indonesia |
| Template ThemeForest, dll | Tidak ada auto-generate command | Satu command, langsung jadi project jalan |

## Prinsip Arsitektur Kunci (WAJIB DIPAHAMI SEBELUM BACA FILE LAIN)
1. **Slug, bukan URL langsung.** Command yang dilihat user tidak pernah menyebut URL GitHub. Selalu berbentuk `--template=slug-pendek`. CLI menerjemahkan slug ke URL lewat API. Detail: `07-template-slug-system.md`.
2. **Kombinasi terbatas, bukan kustomisasi bebas.** MVP TIDAK punya fitur "pilih database apapun + payment apapun secara bebas". Yang ada cuma beberapa paket pre-built yang sudah direview manusia. Detail & alasan: `17-roadmap-custom-combination-engine.md`.
3. **AI tidak generate kode integrasi.** AI cuma boleh: (a) merekomendasikan kombinasi dari daftar yang ada, (b) menjawab pertanyaan troubleshooting berdasarkan dokumentasi. AI TIDAK BOLEH menulis kode payment/auth secara real-time. Detail: `13-ai-recommendation-assistant.md` dan `14-ai-setup-chatbot.md`.
4. **Tools ini tidak bertanggung jawab provisioning akun pihak ketiga.** Tools cuma sampai generate `.env.example` (daftar variable) dan `SETUP.md` (panduan manual). Tidak pernah membuatkan akun Supabase/Midtrans untuk user. Detail: `12-env-and-setup-doc-generation.md`.
5. **Repo template bersifat PUBLIC di MVP.** Karena CLI melakukan `git clone` tanpa autentikasi/token. Konsekuensi: isi kode template bisa dilihat siapa saja. Detail: `10-github-repo-management.md`.

## Target User
- Developer individu atau tim kecil (2-5 orang) yang familiar command line
- Developer junior yang butuh contoh struktur project mengikuti best practice

## Scope MVP (Ringkas)
- 1 framework utama: Next.js (App Router, versi terbaru)
- 2-3 kategori template: E-commerce, Landing Page, Portfolio
- Tiap kategori punya minimal 1 versi "basic" (tanpa integrasi) + 1 versi dengan integrasi umum (Supabase + Midtrans)
- Web untuk visual selection + admin panel sederhana untuk kelola metadata template
- CLI yang dipublish ke npm (`npx` dan install global)
- AI Recommendation Assistant + AI Setup Chatbot

## Log Resolusi Ambiguitas (Update Setelah Review AI Agent)
Beberapa keputusan berikut diambil setelah review silang antar dokumen menemukan celah yang perlu diklarifikasi:
1. **Endpoint `GET /api/templates/:slug` menyertakan data integrasi LENGKAP** (bukan hanya `opsi_integrasi` berupa daftar kode) dalam satu response, untuk menghindari N+1 request dari CLI. Lihat `04-api-backend-architecture.md` dan `12-env-and-setup-doc-generation.md`.
2. **CLI diizinkan memanggil endpoint publik `GET /api/templates`** untuk mengisi interactive prompt saat dijalankan tanpa parameter `--template` — ini konsisten dengan prinsip "tidak hardcode data" di `07-template-slug-system.md`. Lihat `02-cli-architecture.md`.
3. **Screenshot template di admin panel menggunakan input URL manual untuk MVP**, bukan upload ke Supabase Storage — keputusan ini mengurangi kompleksitas implementasi yang tidak krusial untuk lomba. Lihat `06-admin-panel-architecture.md`.

## Referensi Dokumen Lain
Lihat `README.md` di root folder `docs/` untuk daftar lengkap semua file dan urutan baca yang disarankan.

## Referensi Silang
Dokumen ini adalah ringkasan. Untuk detail lengkap tujuan bisnis, metrik keberhasilan, dan analisis risiko, lihat `PRD-scaffolding-tool.md` di root project.