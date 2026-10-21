import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase-server";
import { isRateLimited, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS } from "@/lib/rate-limit";
import { logActivity } from "@/lib/activity";
import { notifySubmissionEvent } from "@/lib/email/submission-notifications";

const STATUSES = ["pending", "auditing", "needs_revision", "accepted", "rejected", "published"] as const;
const SEVERITIES = ["INFO", "LOW", "MEDIUM", "HIGH", "CRITICAL"] as const;
const MAX_BODY_BYTES = 128 * 1024;
const MAX_AUDIT_REPORT_BYTES = 100_000;

interface RouteParams {
  params: Promise<{ id: string }>;
}

/** Update status/catatan/audit submission. Admin only. */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const auth = await requireAdmin(request);
  if (!auth.ok) return auth.response;
  const { supabase, email, userId } = auth.ctx;

  if (isRateLimited(`admin-write:${userId}`, ADMIN_WRITE_LIMIT, ADMIN_WRITE_WINDOW_MS)) {
    return NextResponse.json({ error: "Terlalu banyak perubahan. Tunggu ±10 menit." }, { status: 429 });
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.startsWith("application/json")) {
    return NextResponse.json({ error: "Content-Type harus application/json." }, { status: 415 });
  }
  const declaredLength = request.headers.get("content-length");
  if (declaredLength) {
    const bytes = Number(declaredLength);
    if (!Number.isFinite(bytes) || bytes < 0) {
      return NextResponse.json({ error: "Content-Length tidak valid." }, { status: 400 });
    }
    if (bytes > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Body terlalu besar." }, { status: 413 });
    }
  }

  let body: unknown;
  try {
    const raw = await request.text();
    if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
      return NextResponse.json({ error: "Body terlalu besar." }, { status: 413 });
    }
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Body harus berupa JSON yang valid." }, { status: 400 });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Body harus berupa JSON object." }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const patch: Record<string, unknown> = { reviewed_by: email ?? userId };

  if ("status" in b) {
    const status = typeof b.status === "string" ? b.status.trim().toLowerCase() : "";
    if (!(STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: "Status submission tidak valid." }, { status: 400 });
    }
    patch.status = status;
  }
  if ("review_note" in b) {
    const note = typeof b.review_note === "string" ? b.review_note.trim() : "";
    if (note.length > 2000) {
      return NextResponse.json({ error: "Catatan maksimal 2000 karakter." }, { status: 400 });
    }
    patch.review_note = note || null;
  }
  if ("audit_commit" in b) {
    const commit = typeof b.audit_commit === "string" ? b.audit_commit.trim() : "";
    if (commit && !/^[a-f0-9]{7,64}$/i.test(commit)) {
      return NextResponse.json({ error: "Commit harus SHA heksadesimal 7-64 karakter." }, { status: 400 });
    }
    patch.audit_commit = commit || null;
  }
  if ("audit_severity" in b) {
    const severity = typeof b.audit_severity === "string" ? b.audit_severity.trim().toUpperCase() : "";
    if (severity && !(SEVERITIES as readonly string[]).includes(severity)) {
      return NextResponse.json({ error: "Severity audit tidak valid." }, { status: 400 });
    }
    patch.audit_severity = severity || null;
  }
  if ("audit_report" in b) {
    const report = b.audit_report ?? null;
    if (report !== null && (typeof report !== "object" || Array.isArray(report))) {
      return NextResponse.json({ error: "Audit report harus JSON object." }, { status: 400 });
    }
    if (report !== null && JSON.stringify(report).length > MAX_AUDIT_REPORT_BYTES) {
      return NextResponse.json({ error: "Audit report terlalu besar." }, { status: 413 });
    }
    patch.audit_report = report;
  }

  if (Object.keys(patch).length === 1) {
    return NextResponse.json({ error: "Tidak ada field yang diubah." }, { status: 400 });
  }

  const { data: existing, error: existingError } = await supabase
    .from("submissions")
    .select("id,nama,author_name,framework,kategori,contact_email,status,review_note,template_slug")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return NextResponse.json({ error: "Submission tidak ditemukan." }, { status: 404 });
  }

  const nextStatus = typeof patch.status === "string" ? patch.status : existing.status;
  const nextNote = "review_note" in patch ? (patch.review_note as string | null) : existing.review_note;
  if (
    nextStatus !== existing.status &&
    (nextStatus === "needs_revision" || nextStatus === "rejected") &&
    (!nextNote || nextNote.trim().length < 10)
  ) {
    return NextResponse.json(
      { error: "Catatan minimal 10 karakter wajib diisi untuk revisi atau penolakan." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("submissions")
    .update(patch)
    .eq("id", id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Gagal memperbarui submission." }, { status: 500 });
  }

  // Email hanya dikirim saat status benar-benar berubah. `accepted` ditangani
  // oleh route accept karena butuh draft template; `published` oleh route template.
  const notification =
    nextStatus !== existing.status &&
    (nextStatus === "needs_revision" || nextStatus === "rejected")
      ? await notifySubmissionEvent(
          { ...existing, review_note: nextNote },
          nextStatus
        )
      : undefined;

  await logActivity(supabase, email, "submission.update", "submission", id, data.nama);
  return NextResponse.json({
    submission: data,
    ...(notification ? { notification } : {}),
  });
}
