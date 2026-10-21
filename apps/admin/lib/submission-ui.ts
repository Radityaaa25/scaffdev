import type { Submission } from "@scaff/database";

export const STATUS_META: Record<Submission["status"], { label: string; cls: string; action: string }> = {
  pending: {
    label: "Baru",
    cls: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    action: "Mulai audit otomatis",
  },
  auditing: {
    label: "Siap direview",
    cls: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    action: "Tinjau hasil audit",
  },
  needs_revision: {
    label: "Perlu revisi",
    cls: "bg-orange-500/15 text-orange-300 border-orange-500/30",
    action: "Menunggu kontributor",
  },
  accepted: {
    label: "Diterima",
    cls: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    action: "Lengkapi draft",
  },
  rejected: {
    label: "Ditolak",
    cls: "bg-red-500/15 text-red-300 border-red-500/30",
    action: "Selesai",
  },
  published: {
    label: "Tayang",
    cls: "bg-[#8B5CF6]/15 text-[#C4B5FD] border-[#8B5CF6]/30",
    action: "Lihat template",
  },
};

export function formatSubmissionDate(iso: string): string {
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

export function severityCls(severity: string | null): string {
  if (severity === "CRITICAL") return "text-red-300 border-red-500/40 bg-red-500/15";
  if (severity === "HIGH") return "text-red-300 border-red-500/30 bg-red-500/10";
  if (severity === "MEDIUM") return "text-amber-300 border-amber-500/30 bg-amber-500/10";
  if (severity === "LOW") return "text-sky-300 border-sky-500/30 bg-sky-500/10";
  if (severity === "INFO") return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
  return "text-zinc-400 border-white/10 bg-white/5";
}
