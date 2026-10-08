---
title: Audit Keamanan Repository
description: Cara Scaffdev memeriksa keamanan repository template sebelum clone dan install, plus panduan pemeriksaan manual.
order: 9
section: Panduan
---

# Audit Keamanan Repository

Menjalankan kode orang lain selalu berisiko. CLI Scaffdev memeriksa repository template **sebelum** meng-clone dan **sebelum** menginstall dependency, supaya kamu bisa berhenti sebelum kode berbahaya berjalan.

> Membutuhkan CLI `0.3.0+` (`npx scaffdev@latest --version` untuk cek).

## 1. Kenapa repository perlu diaudit

`git clone` sendiri aman (hanya mengunduh file). Bahayanya muncul belakangan:

- `npm install` / `composer install` bisa **menjalankan script otomatis** (`postinstall` dkk) yang mengunduh dan mengeksekusi program dari internet.
- File konfigurasi (git hooks, workflow CI, task editor) bisa berisi perintah yang berjalan saat kamu memakai git atau editor.
- Karena itu audit Scaffdev ditaruh **sebelum execution boundary**: sebelum clone (audit remote) dan sebelum install (audit lokal + konfirmasi).

## 2. Alur audit di CLI

```text
pilih template → Run security audit? [Y/n]
  → Ya: audit statis → tampilkan hasil → konfirmasi → git clone
  → post-clone audit lokal → konfirmasi → install dependency
  → Tidak: warning → konfirmasi "Lanjut tanpa audit? [y/N]" (default N)
```

Melewati audit butuh persetujuan eksplisit dua kali. Tidak ada jalur diam-diam.

## 3. Apa yang diperiksa (pre-clone, remote)

CLI mengunduh arsip repository (tanpa clone, tanpa eksekusi) lalu memeriksa file-file ini secara statis:

| File | Yang dicari |
|---|---|
| `package.json` | Script lifecycle (`preinstall`, `install`, `postinstall`, `prepare`, `prepublish`, `prepublishOnly`) + dependensi ber-URL/git |
| `composer.json` | Script Composer (`pre-install-cmd`, `post-install-cmd`, `pre-update-cmd`, `post-update-cmd`) |
| `.github/workflows/*` | Blok `run:` berisi shell/download, secret yang diteruskan ke `curl`/`wget` |
| `.vscode/tasks.json`, `launch.json` | Command yang didefinisikan (tidak auto-run, hanya dicatat) |
| `Dockerfile`, `compose.yml` | `RUN` berisi download, `CMD`/`ENTRYPOINT` shell |

Pola berbahaya yang dicari: perintah download (`curl`, `wget`, `Invoke-WebRequest`, `certutil`, `bitsadmin`), eksekusi (`eval`, `exec`, `spawn`, `child_process`, `os.system`, `bash -c`, `powershell`), dan obfuscation (`base64`, `atob`, `Buffer.from`, `fromCharCode`, `EncodedCommand`, `eval(...)`, `Function(...)`).

## 4. Severity: konteks, bukan sekadar keyword

`curl` sendirian bukan bukti apa-apa (dokumentasi pun menyebutnya). Severity naik bila ada **kombinasi**:

- **INFO**: command pengembangan normal yang terdeteksi.
- **LOW**: command eksternal tapi konteksnya sah (mis. `curl` di Dockerfile, task VS Code).
- **MEDIUM**: lifecycle script terdeteksi. Berjalan otomatis saat install, jadi wajib dibaca isinya.
- **HIGH**: download remote + eksekusi (`curl <url> | bash`), atau secret diteruskan ke downloader.
- **CRITICAL**: payload remote ter-obfuscate lalu dieksekusi, atau PowerShell encoded command.

Temuan HIGH/CRITICAL memblokir instalasi secara default (lanjut butuh konfirmasi eksplisit).

## 5. Yang TIDAK bisa diperiksa sebelum clone

Metadata `.git` (`config` dan `hooks`) baru ada setelah clone, jadi audit remote tidak menyentuhnya. CLI jujur soal ini di laporan ("tidak tersedia sebelum clone") dan memeriksanya di **audit lokal tahap 2** setelah clone:

- `core.hooksPath`, `core.fsmonitor`, `core.pager`, `core.sshCommand`
- `alias` berisi `!` (eksekusi shell), `credential.helper`, driver diff/merge eksternal, filter `clean`/`smudge`
- Isi `.git/hooks/*` (dibaca saja — hook **tidak pernah** dijalankan untuk diperiksa)

Bila audit lokal menemukan yang mencurigakan, instalasi di-pause sebelum `npm install` / `composer install` berjalan. Folder `.git` hasil clone dihapus setelah audit (seperti perilaku lama) supaya project-mu bersih.

## 6. Pemeriksaan manual (copy-paste)

Perintah di bawah bisa kamu jalankan sendiri kapan pun, tanpa CLI:

```bash
# 1. Lifecycle script npm (wajib dibaca satu per satu bila ada)
node -e "const p=require('./package.json'); console.log(p.scripts)"

# 2. Script Composer
composer validate --no-check-publish 2>&1 | head -20
node -e "const c=require('./composer.json'); console.log(c.scripts)"

# 3. Cari pola download lalu eksekusi (abaikan hasil di dokumentasi/*.md)
grep -rn --include="*.json" --include="*.js" --include="*.php" --include="*.yml" -E "curl[^|]*\|\s*(bash|sh)|powershell.*-e(ncodedCommand)?" . | grep -v node_modules | head -20

# 4. Konfigurasi git mencurigakan
git config --list --show-origin | grep -iE "hookspath|fsmonitor|pager|sshcommand|credential|alias|filter|diff.*external|merge.*driver" || echo "bersih"

# 5. Hook aktif (abaikan *.sample bawaan git)
ls .git/hooks/ | grep -v "\.sample$" || echo "tidak ada hook aktif"

# 6. Workflow CI yang menjalankan shell/download
grep -rn -A3 "^ *run:" .github/workflows/ 2>/dev/null | head -30 || echo "tidak ada workflow"
```

## 7. Batasan yang jujur

Audit ini adalah **static analysis**. Ia tidak bisa mendeteksi logika jahat yang disamarkan rapi, dependensi transitive yang berubah setelah audit, atau serangan yang baru muncul kemudian. Istilah yang kami pakai:

- Dipakai: `Security Audit`, `Repository Safety Check`, `Static Security Analysis`, `No high-risk findings detected`.
- Tidak dipakai: `100% Safe`, `Malware Free`, `Virus Free`, `Guaranteed Safe`.

Tetap perlakukan template asing seperti kode asing: baca diff-nya, jalankan dulu di environment sekali pakai bila ragu, dan laporkan temuan lewat halaman Lapor Bug.
