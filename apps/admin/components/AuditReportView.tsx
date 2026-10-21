"use client";

import type { AuditFinding, Severity } from "@scaff/security-audit";
import type { SubmissionAuditReport } from "@/lib/submission-audit";
import { severityCounts } from "@/lib/submission-audit";

const SEV_ORDER: Severity[] = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFO"];

const SEV_CLS: Record<Severity, string> = {
  CRITICAL: "border-red-500/35 bg-red-500/12 text-red-300",
  HIGH: "border-red-500/30 bg-red-500/10 text-red-300",
  MEDIUM: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  LOW: "border-sky-500/30 bg-sky-500/10 text-sky-300",
  INFO: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function Finding({ finding }: { finding: AuditFinding }) {
  return (
    <li className="rounded-xl border border-white/8 bg-black/20 p-3.5">
      <div className="flex flex-wrap items-center gap-2">
        <span className={`rounded border px-2 py-0.5 font-mono text-[10px] font-bold ${SEV_CLS[finding.severity]}`}>
          {finding.severity}
        </span>
        <span className="text-sm font-medium text-zinc-200">{finding.title}</span>
      </div>
      <p className="mt-1.5 font-mono text-[11px] text-zinc-500">{finding.file}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-zinc-400">{finding.detail}</p>
      {finding.evidence && (
        <pre className="mt-2 overflow-x-auto rounded-lg border border-white/5 bg-black/30 p-2 font-mono text-[10px] leading-relaxed text-zinc-500">
          {finding.evidence}
        </pre>
      )}
    </li>
  );
}

interface Props {
  report: SubmissionAuditReport | null;
  busy: boolean;
  elapsed: number;
  error: string | null;
  onRun: () => void;
}

export function AuditReportView({ report, busy, elapsed, error, onRun }: Props) {
  if (busy) {
    return (
      <div className="rounded-xl border border-[#8B5CF6]/25 bg-[#8B5CF6]/[0.06] p-5">
        <div className="flex items-center gap-3">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#8B5CF6]/30 border-t-[#A78BFA]" />
          <div>
            <p className="text-sm font-semibold text-zinc-100">Audit otomatis berjalan…</p>
            <p className="mt-0.5 text-xs text-zinc-500">
              Mengunduh arsip, memeriksa file konfigurasi, lalu merangkum hasil. {elapsed} detik.
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-2 text-[11px] text-zinc-500 sm:grid-cols-3">
          <span className="rounded-lg border border-white/5 bg-black/20 px-3 py-2">1. Unduh tarball GitHub</span>
          <span className="rounded-lg border border-white/5 bg-black/20 px-3 py-2">2. Static analysis read-only</span>
          <span className="rounded-lg border border-white/5 bg-black/20 px-3 py-2">3. Ringkasan AI</span>
        </div>
        <p className="mt-3 text-[11px] text-zinc-600">Jangan tutup panel sampai audit selesai.</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="rounded-xl border border-white/8 bg-black/20 p-5">
        <p className="text-sm font-semibold text-zinc-100">Belum ada hasil audit otomatis</p>
        <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-400">
          Audit akan memeriksa script install, workflow GitHub Actions, Dockerfile, dan konfigurasi
          VS Code. Kode repo tidak dijalankan. Audit ini gate awal, bukan jaminan 100% aman.
        </p>
        {error && (
          <p className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={onRun}
          className="mt-4 rounded-lg bg-[#8B5CF6] px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-[#8B5CF6]/20 transition-all hover:bg-[#7C3AED] active:scale-95"
        >
          Jalankan Audit Otomatis
        </button>
      </div>
    );
  }

  const top = report.highestSeverity;
  const counts = severityCounts(report.findings);
  const ordered = [...report.findings].sort(
    (a, b) => SEV_ORDER.indexOf(a.severity) - SEV_ORDER.indexOf(b.severity)
  );
  const risky = top === "HIGH" || top === "CRITICAL";

  return (
    <div className="space-y-3">
      <div className={`rounded-xl border p-4 ${risky ? "border-red-500/30 bg-red-500/[0.07]" : report.status === "partial" ? "border-amber-500/30 bg-amber-500/[0.06]" : "border-white/8 bg-black/20"}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${top ? SEV_CLS[top] : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"}`}>
                {top ?? "Tidak ada temuan"}
              </span>
              {report.status === "partial" && (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] text-amber-300">
                  Audit parsial
                </span>
              )}
            </div>
            <p className="mt-2 text-xs text-zinc-400">
              {report.findings.length} temuan · {report.inspected.length} file diperiksa
              {report.commit ? ` · commit ${report.commit.slice(0, 7)}` : " · commit belum terbaca"}
            </p>
            <p className="mt-0.5 text-[11px] text-zinc-600">Audit {formatDate(report.auditedAt)}</p>
          </div>
          <button
            type="button"
            onClick={onRun}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:bg-white/10 active:scale-95"
          >
            Audit ulang
          </button>
        </div>

        {error && (
          <p className="mt-3 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-xs text-red-200">
            {error}
          </p>
        )}

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {SEV_ORDER.map((sev) => (
            <div key={sev} className="rounded-lg border border-white/5 bg-black/20 px-2.5 py-2">
              <p className="font-mono text-[10px] text-zinc-600">{sev}</p>
              <p className={`mt-0.5 text-sm font-bold ${counts[sev] > 0 ? SEV_CLS[sev].split(" ").pop() : "text-zinc-500"}`}>
                {counts[sev]}
              </p>
            </div>
          ))}
        </div>

        {!report.commit && (
          <p className="mt-3 text-xs leading-relaxed text-amber-300">
            Commit SHA tidak terbaca dari GitHub. Isi manual di bagian Review manual sebelum menerima.
          </p>
        )}
        {report.status === "partial" && (
          <p className="mt-3 text-xs leading-relaxed text-amber-300">
            Sebagian pemeriksaan tidak bisa dilakukan. Baca batasan audit dan lanjutkan review manual.
          </p>
        )}
      </div>

      {report.ai && (
        <div className="rounded-xl border border-[#8B5CF6]/20 bg-[#8B5CF6]/[0.05] p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#C4B5FD]">Ringkasan AI</h4>
            <span className="rounded-full border border-white/10 bg-black/20 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
              {report.ai.model ?? "Groq"} · bantuan, bukan keputusan
            </span>
          </div>
          {report.ai.status === "ok" ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-zinc-300">{report.ai.summary}</p>
              {!!report.ai.highlights?.length && (
                <ul className="mt-3 space-y-1.5">
                  {report.ai.highlights.map((item, index) => (
                    <li key={index} className="flex gap-2 text-xs leading-relaxed text-zinc-400">
                      <span className="mt-1 text-[#A78BFA]">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
              {!!report.ai.manualChecks?.length && (
                <div className="mt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Wajib dicek manual</p>
                  <ul className="mt-1.5 space-y-1">
                    {report.ai.manualChecks.map((item, index) => (
                      <li key={index} className="text-xs leading-relaxed text-zinc-400">— {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          ) : (
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              {report.ai.reason ?? "Ringkasan AI tidak tersedia. Gunakan temuan statis di bawah."}
            </p>
          )}
        </div>
      )}

      {ordered.length > 0 ? (
        <ul className="space-y-2">
          {ordered.map((finding, index) => (
            <Finding key={`${finding.file}-${finding.title}-${index}`} finding={finding} />
          ))}
        </ul>
      ) : (
        <p className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] px-4 py-3 text-xs leading-relaxed text-emerald-300">
          Tidak ada pola berisiko yang terdeteksi pada file yang diperiksa. Ini bukan jaminan repo
          bebas masalah; review manual tetap wajib.
        </p>
      )}

      <details className="rounded-xl border border-white/8 bg-black/20 p-3.5">
        <summary className="cursor-pointer text-xs font-medium text-zinc-400">
          Detail pemeriksaan &amp; batasan
        </summary>
        <div className="mt-3 space-y-2 text-[11px] leading-relaxed text-zinc-500">
          <p>
            <span className="text-zinc-400">File diperiksa:</span>{" "}
            {report.inspected.length ? report.inspected.join(", ") : "tidak ada"}
          </p>
          {report.notInspectable.map((note, index) => (
            <p key={index}>Catatan: {note}</p>
          ))}
          <p>Audit statis ini tidak menjamin repository 100% aman.</p>
        </div>
      </details>
    </div>
  );
}
