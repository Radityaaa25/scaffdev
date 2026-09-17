# Dokumentasi Arsitektur Proyek

Folder ini berisi seluruh dokumentasi teknis proyek, ditulis agar bisa dijadikan rujukan oleh siapa pun (developer maupun AI agent) yang mengerjakan bagian mana pun dari proyek ini secara terpisah, dari perangkat berbeda, tanpa kehilangan konteks keputusan yang sudah diambil.

**PENTING:** Folder `docs/` ini berada DI LUAR struktur monorepo Turborepo (`apps/` dan `packages/`), murni dokumentasi, tidak ikut proses build apapun.

## Urutan Baca yang Disarankan

### Wajib Dibaca Pertama
1. `00-overview.md` — Konteks produk, masalah yang diselesaikan, dan 5 prinsip arsitektur kunci yang WAJIB dipahami sebelum membaca file lain
2. `01-monorepo-structure.md` — Struktur folder proyek secara keseluruhan

### Arsitektur Inti (Baca Sesuai Bagian yang Sedang Dikerjakan)
3. `02-cli-architecture.md`
4. `03-database-architecture.md`
5. `04-api-backend-architecture.md`
6. `05-web-frontend-architecture.md`
7. `06-admin-panel-architecture.md`

### Sistem & Logic Kritis (Wajib Dipahami Siapa pun yang Menyentuh Bagian Terkait)
8. `07-template-slug-system.md` — **Baca ini jika bingung soal "bagaimana command tahu repo mana"**
9. `08-template-best-practice-standard.md` — **Baca ini sebelum membuat template baru**
10. `09-multi-framework-support.md`

### Integrasi Eksternal
11. `10-github-repo-management.md`
12. `11-npm-publishing-guide.md`
13. `12-env-and-setup-doc-generation.md`

### Fitur AI
14. `13-ai-recommendation-assistant.md`
15. `14-ai-setup-chatbot.md`

### Keamanan & Kualitas
16. `15-security-guidelines.md` — **Rujukan wajib untuk semua pertanyaan seputar keamanan**
17. `16-design-system-ui-guideline.md`

### Roadmap (BUKAN Bagian dari MVP — Jangan Diimplementasikan Tanpa Keputusan Eksplisit)
18. `17-roadmap-custom-combination-engine.md`
19. `18-roadmap-marketplace.md`

### Referensi Umum
20. `19-naming-conventions-glossary.md` — **Cek di sini jika menemukan istilah yang tidak familiar**

## Dokumen Terkait di Luar Folder Ini
- `PRD-scaffolding-tool.md` (di root project) — Product Requirements Document lengkap: tujuan bisnis, target user, metrik keberhasilan, analisis risiko

## Prinsip Kerja dengan Dokumentasi Ini
1. Jika mengerjakan satu bagian proyek (misal hanya CLI), tetap baca `00-overview.md` dan `07-template-slug-system.md` terlebih dahulu — dua file ini berisi prinsip yang memengaruhi hampir semua bagian lain.
2. Jika ada keputusan arsitektur baru yang diambil selama development, WAJIB diperbarui di file terkait, bukan hanya diingat secara lisan/chat.
3. Jika menemukan ketidaksesuaian antara dokumentasi dan kode aktual, dokumentasi yang harus diperbarui mengikuti kode yang benar (atau sebaliknya, jika kode menyimpang dari keputusan arsitektur yang sudah disepakati, kode yang harus diperbaiki) — jangan biarkan keduanya tidak sinkron.
