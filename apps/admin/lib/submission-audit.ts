import type { AuditFinding, Severity } from "@scaff/security-audit";

export type AuditAiStatus = "ok" | "failed" | "skipped";

export interface AuditAiSummary {
  status: AuditAiStatus;
  model?: string;
  summary?: string;
  highlights?: string[];
  manualChecks?: string[];
  reason?: string;
}

export interface ManualReview {
  checklist: Record<string, boolean>;
  reviewedAt?: string;
}

/**
 * Bentuk audit_report yang disimpan di submissions. Tidak ada migration:
 * data lama/unknown tetap ditampilkan sebagai "belum ada audit otomatis".
 */
export interface SubmissionAuditReport {
  version: 1;
  status: "completed" | "partial";
  repo: string;
  ref: string | null;
  commit: string | null;
  auditedAt: string;
  inspected: string[];
  notInspectable: string[];
  findings: AuditFinding[];
  highestSeverity: Severity | null;
  ai?: AuditAiSummary;
  manual?: ManualReview;
}

export const MANUAL_CHECKLIST = [
  { id: "repo", label: "Repo dan data submission cocok" },
  { id: "secrets", label: "Tidak ada secret/.env di repo atau history" },
  { id: "deps", label: "Dependency dan lisensi wajar" },
  { id: "build", label: "Build/lint berhasil di mesin admin" },
  { id: "demo", label: "Demo dan screenshot sesuai" },
  { id: "readme", label: "README dan .env.example memadai" },
] as const;

export function parseAuditReport(value: unknown): SubmissionAuditReport | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const raw = value as Record<string, unknown>;
  if (raw.version !== 1 || (raw.status !== "completed" && raw.status !== "partial")) {
    return null;
  }
  const findings = Array.isArray(raw.findings)
    ? raw.findings.filter((f): f is AuditFinding => {
        if (!f || typeof f !== "object") return false;
        const item = f as Record<string, unknown>;
        return (
          typeof item.severity === "string" &&
          typeof item.file === "string" &&
          typeof item.title === "string" &&
          typeof item.detail === "string"
        );
      })
    : [];
  return {
    version: 1,
    status: raw.status,
    repo: typeof raw.repo === "string" ? raw.repo : "",
    ref: typeof raw.ref === "string" ? raw.ref : null,
    commit: typeof raw.commit === "string" ? raw.commit : null,
    auditedAt: typeof raw.auditedAt === "string" ? raw.auditedAt : "",
    inspected: Array.isArray(raw.inspected)
      ? raw.inspected.filter((x): x is string => typeof x === "string")
      : [],
    notInspectable: Array.isArray(raw.notInspectable)
      ? raw.notInspectable.filter((x): x is string => typeof x === "string")
      : [],
    findings,
    highestSeverity:
      typeof raw.highestSeverity === "string" ? (raw.highestSeverity as Severity) : null,
    ...(raw.ai && typeof raw.ai === "object" ? { ai: raw.ai as AuditAiSummary } : {}),
    ...(raw.manual && typeof raw.manual === "object"
      ? { manual: raw.manual as ManualReview }
      : {}),
  };
}

export function severityCounts(findings: AuditFinding[]): Record<Severity, number> {
  const counts: Record<Severity, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
    INFO: 0,
  };
  for (const finding of findings) counts[finding.severity] += 1;
  return counts;
}
