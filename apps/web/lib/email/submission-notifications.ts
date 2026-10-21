import { buildSubmissionStatusEmail, type SubmissionEmailEvent } from "./submission-status";
import { sendEmail, type EmailDeliveryStatus } from "./transport";

export interface SubmissionEmailSource {
  nama: string;
  author_name: string;
  framework: string;
  kategori: string;
  contact_email: string;
  review_note?: string | null;
  template_slug?: string | null;
}

/**
 * Hasil notifikasi yang ikut dikembalikan ke admin.
 * `text` selalu disertakan agar admin bisa mengirim ulang secara manual
 * kalau Resend gagal atau konfigurasi env belum lengkap.
 */
export interface SubmissionNotification {
  status: EmailDeliveryStatus;
  reason?: string;
  to: string;
  subject: string;
  text: string;
}

export async function notifySubmissionEvent(
  submission: SubmissionEmailSource,
  event: SubmissionEmailEvent
): Promise<SubmissionNotification> {
  const built = buildSubmissionStatusEmail({
    event,
    nama: submission.nama,
    authorName: submission.author_name,
    framework: submission.framework,
    kategori: submission.kategori,
    reviewNote: submission.review_note,
    templateSlug: submission.template_slug,
  });

  const delivery = await sendEmail({
    to: submission.contact_email,
    subject: built.subject,
    html: built.html,
    text: built.text,
  });

  return {
    status: delivery.status,
    ...(delivery.reason ? { reason: delivery.reason } : {}),
    to: submission.contact_email,
    subject: built.subject,
    text: built.text,
  };
}
