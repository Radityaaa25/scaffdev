"use client";

import { useEffect, useRef } from "react";

interface KontribusiTermsDialogProps {
  open: boolean;
  onClose: () => void;
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Modal Syarat & Ketentuan kontribusi. Konten statis (first-party), jadi tidak
 * ada HTML dari user yang dirender di sini.
 */
export function KontribusiTermsDialog({ open, onClose }: KontribusiTermsDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;

      const panel = panelRef.current;
      if (!panel) return;
      const nodes = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (node) => !node.hasAttribute("disabled") && node.offsetParent !== null
      );
      if (nodes.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={() => onCloseRef.current()}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        aria-describedby="terms-desc"
        tabIndex={-1}
        className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#1B1B21] shadow-2xl outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
          <div>
            <h2 id="terms-title" className="text-base font-semibold text-[#FAFAFA]">
              Syarat &amp; Ketentuan Kontribusi Template
            </h2>
            <p id="terms-desc" className="mt-1 text-xs text-zinc-500">
              Terakhir diperbarui: 21 Oktober 2026
            </p>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => onCloseRef.current()}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            Tutup
          </button>
        </div>

        <div className="space-y-4 overflow-y-auto px-6 py-5 text-sm leading-relaxed text-zinc-300">
          <p>
            Dengan mengirim template lewat form ini, kamu menyetujui ketentuan berikut.
            Baca sampai selesai sebelum mencentang persetujuan.
          </p>

          <section>
            <h3 className="mb-1.5 font-semibold text-zinc-100">1. Kepemilikan template</h3>
            <p>
              Kamu tetap pemilik repo dan kode templatemu. Scaffdev tidak mengambil alih
              kepemilikan. Kami hanya menyimpan <strong>mirror</strong> pada commit yang
              diaudit agar template tetap stabil dan bisa didistribusikan.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-zinc-100">2. Izin yang kamu berikan</h3>
            <p>
              Kamu memberi Scaffdev izin non-eksklusif, gratis, dan berlaku global untuk
              menyimpan mirror, menampilkan screenshot/demo, mempromosikan template, serta
              mendistribusikannya lewat katalog web dan CLI. Kredit nama author dan link
              repo asli tetap dicantumkan.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-zinc-100">3. Audit dan publikasi</h3>
            <p>
              Tim boleh meng-clone, membaca, dan menguji repo pada commit tertentu (SHA).
              Publikasi tidak dijamin: template bisa ditolak, diminta revisi, atau ditarik
              bila ditemukan masalah. Perubahan setelah commit audit tidak ikut dinilai
              sampai dilakukan audit ulang.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-zinc-100">4. Konten yang dilarang</h3>
            <p>
              Dilarang mengirim template yang berisi secret/API key asli, malware, kode
              terobfuscate mencurigakan, crypto mining, konten ilegal, data pribadi orang
              lain, atau aset berhak cipta tanpa izin. Template juga tidak boleh menyesatkan
              pengguna atau menyamar sebagai produk lain.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-zinc-100">5. Tanggung jawab</h3>
            <p>
              Kamu bertanggung jawab atas kode, klaim, dan aset yang kamu kirim, termasuk
              bila ada klaim pihak ketiga. Template komunitas disediakan apa adanya tanpa
              jaminan. Scaffdev tidak bertanggung jawab atas kerugian yang timbul dari
              penggunaan template pihak ketiga.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-zinc-100">6. Data pribadi</h3>
            <p>
              Email kontak hanya dipakai tim untuk koordinasi review dan tidak ditampilkan
              publik. Data submission disimpan di Supabase dan dapat dihapus setelah proses
              review selesai, kecuali jejak audit yang diperlukan untuk keamanan.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-zinc-100">7. Perubahan dan penarikan</h3>
            <p>
              Ketentuan ini bisa diperbarui sewaktu-waktu; versi terbaru berlaku saat kamu
              mengirim submission. Kamu bisa meminta template di-unpublish kapan saja, tetapi
              histori audit tetap disimpan sebagai bukti proses.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-semibold text-zinc-100">8. Hukum yang berlaku</h3>
            <p>
              Ketentuan ini tunduk pada hukum yang berlaku di Indonesia. Sengketa
              diselesaikan secara musyawarah terlebih dahulu.
            </p>
          </section>

          <p className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-xs text-zinc-400">
            Dengan mencentang persetujuan dan mengirim form, kamu menyatakan telah membaca,
            memahami, dan menyetujui ketentuan ini beserta pernyataan kontribusi/CLA Scaffdev.
          </p>
        </div>

        <div className="border-t border-white/10 px-6 py-4 text-right">
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            className="rounded-xl bg-[#8B5CF6] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#7C3AED]"
          >
            Saya mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
