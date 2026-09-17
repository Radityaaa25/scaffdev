# 11 — NPM Publishing Guide

## Persiapan Awal (Sekali Saja)
1. Buat akun di [npmjs.com](https://www.npmjs.com/signup) — gratis, tidak perlu kartu kredit.
2. Login lewat terminal: `npm login` (akan meminta verifikasi via browser atau OTP tergantung versi npm).
3. Cek ketersediaan nama package sebelum development jauh: `npm view scaffdev` — jika muncul error 404, nama tersedia.

## Struktur `package.json` di `packages/cli/`
```json
{
  "name": "scaff",
  "version": "1.0.0",
  "bin": {
    "scaff": "./dist/index.js"
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup src/index.ts --format cjs --clean",
    "dev": "tsup src/index.ts --format cjs --watch"
  },
  "dependencies": {
    "execa": "^9.0.0",
    "@clack/prompts": "^0.8.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "tsup": "^8.0.0"
  }
}
```

**Penjelasan field kunci:**
- `"bin"` — mendefinisikan command apa yang bisa dipanggil user di terminal setelah install, dan file mana yang dijalankan.
- `"files": ["dist"]` — memastikan hanya folder `dist` (hasil compile) yang ikut ter-publish, bukan `src` (source code asli), agar package tetap ringan.

## Wajib: Shebang Line
Baris pertama file `src/index.ts` HARUS:
```ts
#!/usr/bin/env node
```
Tanpa baris ini, sistem operasi tidak tahu harus menjalankan file tersebut menggunakan Node.js saat dipanggil sebagai command.

## Proses Build dan Publish (Urutan Wajib)
```bash
cd packages/cli

# 1. Install dependency
npm install

# 2. Compile TypeScript (src/index.ts) menjadi JavaScript (dist/index.js)
npm run build

# 3. Login (hanya perlu sekali per sesi/komputer)
npm login

# 4. Publish ke npm registry
npm publish
```

## Update Versi Selanjutnya
Setiap kali ada perubahan kode setelah publish pertama:
```bash
npm version patch   # untuk bug fix kecil, contoh: 1.0.0 -> 1.0.1
# atau
npm version minor   # untuk fitur baru non-breaking, contoh: 1.0.0 -> 1.1.0
# atau
npm version major   # untuk perubahan besar/breaking change, contoh: 1.0.0 -> 2.0.0

npm run build
npm publish
```

## PENTING: Kapan CLI Perlu Di-Publish Ulang, Kapan Tidak
- **PERLU publish ulang:** jika ada perubahan pada logic CLI itu sendiri (`packages/cli/src/`), misalnya menambah sub-command baru, mengubah cara parsing argumen, memperbaiki bug.
- **TIDAK PERLU publish ulang:** jika hanya menambah/mengubah template baru lewat admin panel. Ini karena CLI selalu mengambil data template secara real-time dari API, bukan hardcoded di dalam kode (lihat `07-template-slug-system.md`). Ini adalah prinsip arsitektur inti proyek — jangan sampai ada implementasi yang melanggar prinsip ini di kemudian hari.

## Testing Lokal Sebelum Publish
Sebelum publish ke npm registry, test CLI secara lokal menggunakan:
```bash
npm link
```
Ini membuat command CLI bisa dipanggil secara global di komputer development tanpa harus publish dulu. Setelah selesai testing, jalankan `npm unlink` untuk membersihkan.

## Referensi Silang
- Struktur folder lengkap `packages/cli`: `02-cli-architecture.md`
- Alasan CLI tidak boleh hardcode data template: `07-template-slug-system.md`
