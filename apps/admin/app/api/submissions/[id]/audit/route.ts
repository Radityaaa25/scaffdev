import { NextRequest, NextResponse } from "next/server";
import {
  auditRemoteRepo,
  fetchCommitSha,
  highestSeverity,
  parseGitHubRepo,
} from "@scaff/security-audit";
import { createSupabaseAdminServerClient } from "@/lib/supabase-server";
import { summarizeAudit } from "@/lib/audit-ai";
import { parseAuditReport, type SubmissionAuditReport } from "@/lib/submission-audit";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const WINDOW_MS = 10 * 60 * 1000;
const LIMIT = 6;
const hits = new Map<string, { count: number; reset: number }>();

function rateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = hits.get(userId);
  if (!entry || now > entry.reset) {
    hits.set(userId, { count: 1, reset: now + WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LIMIT;
}

function normalizeRepo(raw: string): { owner: string; repo: string; canonical: string } | null {
  const parsed = parseGitHubRepo(raw);
  if (!parsed) return null;
  if (!/^[a-z0-9_.-]+$/i.test(parsed.owner) || !/^[a-z0-9_.-]+$/i.test(parsed.repo)) {
    return null;
  }
  return {
    owner: parsed.owner,
    repo: parsed.repo,
    canonical: `https://github.com/${parsed.owner}/${parsed.repo}`,
  };
}

async function auditAccess(request: NextRequest) {
  const supabase = await createSupabaseAdminServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  return { ok: true as const, supabase, user };
}

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * Audit otomatis submission (admin-only):
 * unduh tarball → jalankan rule CLI → simpan report → ringkas dengan Groq.
 * Tidak mengeksekusi kode repo dan tidak mengirim email.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  const access = await auditAccess(request);
  if (!access.ok) return access.response;
  const { supabase, user } = access;

  if (rateLimited(user.id)) {
    return NextResponse.json(
      { error: "Terlalu banyak audit. Tunggu ±10 menit lalu coba lagi." },
      { status: 429 }
    );
  }

  const { id } = await params;
  const { data: sub, error: subError } = await supabase
    .from("submissions")
    .select("*")
    .eq("id", id)
    .single();
  if (subError || !sub) {
    return NextResponse.json({ error: "Submission tidak ditemukan." }, { status: 404 });
  }

  const repo = normalizeRepo(sub.repo_url);
  if (!repo) {
    return NextResponse.json(
      { error: "Repo harus berupa URL GitHub publik (https://github.com/owner/repo)." },
      { status: 400 }
    );
  }

  let audit;
  try {
    audit = await auditRemoteRepo(repo.canonical);
  } catch (err) {
    return NextResponse.json(
      {
        error:
          (err as Error).message ||
          "Audit tidak bisa dijalankan. Periksa repo atau coba lagi nanti.",
      },
      { status: 502 }
    );
  }

  const commit = audit.ref
    ? await fetchCommitSha(repo.owner, repo.repo, audit.ref)
    : null;
  const highest = highestSeverity(audit.report.findings);
  const auditedAt = new Date().toISOString();
  const previous = parseAuditReport(sub.audit_report);

  const baseReport: SubmissionAuditReport = {
    version: 1,
    status: audit.remoteInspectable ? "completed" : "partial",
    repo: audit.report.repo,
    ref: audit.ref,
    commit,
    auditedAt,
    inspected: audit.report.inspected,
    notInspectable: audit.report.notInspectable,
    findings: audit.report.findings,
    highestSeverity: highest,
    ...(previous?.manual ? { manual: previous.manual } : {}),
  };

  // Simpan hasil deterministik lebih dulu agar tidak hilang bila Groq timeout.
  const { data: updated, error: updateError } = await supabase
    .from("submissions")
    .update({
      status: "auditing",
      audit_commit: commit,
      audit_severity: highest,
      audit_report: baseReport,
      reviewed_by: user.email ?? user.id,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: "Gagal menyimpan hasil audit." }, { status: 500 });
  }

  const ai = await summarizeAudit({
    repo: repo.canonical,
    ref: audit.ref,
    commit,
    highestSeverity: highest,
    inspected: audit.report.inspected,
    notInspectable: audit.report.notInspectable,
    findings: audit.report.findings,
  });
  const report: SubmissionAuditReport = { ...baseReport, ai };

  const { data: finalRow } = await supabase
    .from("submissions")
    .update({ audit_report: report })
    .eq("id", id)
    .select()
    .single();

  try {
    await supabase.rpc("log_activity", {
      p_actor_email: user.email ?? user.id,
      p_action: "submission.auto_audit",
      p_entity: "submission",
      p_entity_ref: id,
      p_detail: `${sub.nama}: ${highest ?? "tanpa temuan"}${
        commit ? ` @ ${commit.slice(0, 7)}` : ""
      }`,
    });
  } catch {
    /* log tidak boleh menggagalkan audit */
  }

  return NextResponse.json({
    submission: finalRow ?? { ...updated, audit_report: report },
    report,
    ai,
  });
}
