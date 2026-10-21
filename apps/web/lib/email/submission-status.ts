import { SITE_URL } from "../seo";

/**
 * Template email notifikasi submission template komunitas.
 * Dipakai oleh route admin (accept / reject / revisi / publish).
 * Semua nilai dari user di-escape sebelum masuk HTML.
 */

export type SubmissionEmailEvent =
  | "received"
  | "accepted"
  | "needs_revision"
  | "rejected"
  | "published";

export interface SubmissionEmailInput {
  event: SubmissionEmailEvent;
  nama: string;
  authorName: string;
  framework: string;
  kategori: string;
  reviewNote?: string | null;
  templateSlug?: string | null;
}

export interface BuiltSubmissionEmail {
  subject: string;
  html: string;
  text: string;
}

interface EventCopy {
  badge: string;
  badgeColor: string;
  badgeBg: string;
  badgeBorder: string;
  title: string;
  intro: string;
  body: string;
  ctaLabel: string;
  ctaPath: string;
  steps: string[];
}

const MAX_NAME = 120;
const MAX_NOTE = 1_200;

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char] ?? char
  );
}

function cleanInline(value: string | null | undefined, max: number): string {
  return (value ?? "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function cleanMultiline(value: string | null | undefined, max: number): string {
  return (value ?? "")
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, max);
}

function clip(value: string, max: number): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trimEnd()}…`;
}

function formatFramework(value: string): string {
  const kode = cleanInline(value, 40).toLowerCase();
  if (kode === "nextjs") return "Next.js";
  if (kode === "laravel") return "Laravel";
  return kode ? kode.charAt(0).toUpperCase() + kode.slice(1) : "—";
}

function formatKategori(value: string): string {
  const label = cleanInline(value, 60).replace(/-/g, " ");
  if (!label) return "—";
  return label.replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatTanggal(): string {
  try {
    return new Date().toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function absolute(path: string): string {
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function eventCopy(event: SubmissionEmailEvent, nama: string, slug: string | null): EventCopy {
  switch (event) {
    case "received":
      return {
        badge: "SEDANG DITINJAU",
        badgeColor: "#1D4ED8",
        badgeBg: "#EFF6FF",
        badgeBorder: "#BFDBFE",
        title: "Submission kamu sudah kami terima",
        intro: `Terima kasih sudah mengirim "${nama}". Submission kamu sudah masuk antrean review tim Scaffdev.`,
        body: "Tim akan memeriksa repository, demo, screenshot, dan kelengkapan data. Hasil review — termasuk permintaan revisi bila ada — akan dikirim ke email ini. Kamu tidak perlu mengirim ulang.",
        ctaLabel: "Baca panduan kontribusi",
        ctaPath: "/docs/cara-kontribusi-template",
        steps: [
          "Submission menunggu antrean review tim.",
          "Kami kirim hasil review ke email ini.",
          "Cek folder spam bila email belum terlihat.",
        ],
      };
    case "accepted":
      return {
        badge: "DITERIMA",
        badgeColor: "#047857",
        badgeBg: "#ECFDF5",
        badgeBorder: "#A7F3D0",
        title: "Submission kamu diterima",
        intro: `Terima kasih sudah mengirim "${nama}". Tim Scaffdev sudah meninjau submission kamu dan menerimanya ke tahap penyiapan template.`,
        body: "Kami akan menyiapkan mirror repository pada commit yang diaudit, merapikan data template, lalu menerbitkannya di katalog. Nama dan tautan profil kamu tetap dicantumkan sebagai kredit author.",
        ctaLabel: "Baca panduan kontribusi",
        ctaPath: "/docs/cara-kontribusi-template",
        steps: [
          "Tim menyiapkan mirror repository dan draft template.",
          "Kami mengabari lagi lewat email saat template tayang.",
          "Kalau ada perubahan mendesak, hubungi tim lewat halaman dokumentasi.",
        ],
      };
    case "needs_revision":
      return {
        badge: "PERLU REVISI",
        badgeColor: "#B45309",
        badgeBg: "#FFFBEB",
        badgeBorder: "#FDE68A",
        title: "Submission perlu diperbaiki",
        intro: `Terima kasih sudah mengirim "${nama}". Setelah review awal, masih ada beberapa hal yang perlu disesuaikan sebelum submission bisa kami terima.`,
        body: "Silakan baca catatan dari tim di bawah, perbaiki repository atau demo, lalu kirim ulang lewat form kontribusi. Kamu tidak perlu membuat akun baru.",
        ctaLabel: "Perbaiki & kirim ulang",
        ctaPath: "/kontribusi",
        steps: [
          "Baca catatan review dan cek bagian yang disebutkan.",
          "Perbaiki repo, demo, screenshot, atau data submission.",
          "Kirim ulang lewat halaman Kontribusi Template.",
        ],
      };
    case "rejected":
      return {
        badge: "BELUM DITERIMA",
        badgeColor: "#B91C1C",
        badgeBg: "#FEF2F2",
        badgeBorder: "#FECACA",
        title: "Submission belum bisa diterima",
        intro: `Terima kasih sudah meluangkan waktu mengirim "${nama}". Setelah review, submission ini belum bisa kami terima.`,
        body: "Keputusan ini bukan penilaian terhadap kemampuan kamu sebagai developer. Kamu tetap bisa memperbaiki hal yang disebutkan dan mengirim ulang kapan saja.",
        ctaLabel: "Baca panduan kontribusi",
        ctaPath: "/docs/cara-kontribusi-template",
        steps: [
          "Baca alasan penolakan di catatan tim.",
          "Perbaiki hal yang disebutkan bila kamu ingin mengirim ulang.",
          "Kirim ulang lewat halaman Kontribusi Template.",
        ],
      };
    case "published":
      return {
        badge: "TAYANG",
        badgeColor: "#6D28D9",
        badgeBg: "#F5F3FF",
        badgeBorder: "#DDD6FE",
        title: "Template kamu sudah tayang",
        intro: `"${nama}" sudah tayang di katalog Scaffdev dan bisa dipakai lewat CLI.`,
        body: slug
          ? `Halaman template: ${absolute(`/templates/${slug}`)}\n\nTerima kasih sudah berkontribusi. Kredit author tercantum di halaman template, dan repo asli kamu tetap menjadi sumber utama.`
          : "Terima kasih sudah berkontribusi. Kredit author tercantum di halaman template, dan repo asli kamu tetap menjadi sumber utama.",
        ctaLabel: "Lihat template",
        ctaPath: slug ? `/templates/${slug}` : "/templates",
        steps: [
          "Buka halaman template dan cek kredit author.",
          "Bagikan ke komunitas kalau kamu mau.",
          "Hubungi tim lewat dokumentasi bila ada data yang perlu diperbarui.",
        ],
      };
  }
}

function summaryRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:7px 0;font-size:13px;line-height:20px;color:#71717a;width:120px;vertical-align:top;">${label}</td>
    <td style="padding:7px 0;font-size:13px;line-height:20px;color:#27272a;font-weight:600;vertical-align:top;">${value}</td>
  </tr>`;
}

export function buildSubmissionStatusEmail(
  input: SubmissionEmailInput
): BuiltSubmissionEmail {
  const nama = clip(cleanInline(input.nama, 200), MAX_NAME) || "Template tanpa nama";
  const author = cleanInline(input.authorName, 80) || "Kontributor";
  const note = cleanMultiline(input.reviewNote, MAX_NOTE);
  const slug = input.templateSlug ? cleanInline(input.templateSlug, 120) : null;
  const copy = eventCopy(input.event, nama, slug);
  const safeNama = escapeHtml(nama);
  const safeAuthor = escapeHtml(author);
  const safeNote = escapeHtml(note).replace(/\n/g, "<br />");
  const safeFramework = escapeHtml(formatFramework(input.framework));
  const safeKategori = escapeHtml(formatKategori(input.kategori));
  const tanggal = formatTanggal();
  const ctaUrl = absolute(copy.ctaPath);
  const siteUrl = escapeHtml(SITE_URL);

  const subject = cleanInline(
    input.event === "published"
      ? `Template "${nama}" sudah tayang di Scaffdev`
      : input.event === "received"
        ? `Submission "${nama}" sudah kami terima`
        : input.event === "accepted"
          ? `Submission "${nama}" diterima`
          : input.event === "needs_revision"
            ? `Revisi diperlukan untuk "${nama}"`
            : `Update submission "${nama}"`,
    180
  );

  const statusLabel =
    input.event === "received"
      ? "Menunggu review"
      : input.event === "accepted"
        ? "Diterima"
        : input.event === "needs_revision"
          ? "Perlu revisi"
          : input.event === "rejected"
            ? "Ditolak"
            : "Tayang";

  const stepsHtml = copy.steps
    .map(
      (step) =>
        `<li style="margin:0 0 8px;font-size:14px;line-height:22px;color:#3f3f46;">${escapeHtml(step)}</li>`
    )
    .join("");

  const noteHtml = note
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;background:#FAF5FF;border:1px solid #E9D5FF;border-left:3px solid #8B5CF6;border-radius:10px;">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0 0 6px;font-size:11px;line-height:16px;letter-spacing:0.08em;text-transform:uppercase;color:#7E22CE;font-weight:700;">Catatan dari tim</p>
          <p style="margin:0;font-size:14px;line-height:23px;color:#3F3F46;">${safeNote}</p>
        </td></tr>
      </table>`
    : input.event === "needs_revision"
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;background:#FAF5FF;border:1px solid #E9D5FF;border-left:3px solid #8B5CF6;border-radius:10px;">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0;font-size:14px;line-height:23px;color:#3F3F46;">Belum ada catatan rinci dari tim. Cek kembali kelengkapan repo, demo, screenshot, dan data submission sebelum mengirim ulang.</p>
        </td></tr>
      </table>`
      : "";

  const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#F4F4F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181B;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(copy.intro)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F4F5;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border:1px solid #E4E4E7;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#131316;padding:26px 32px 24px;">
              <p style="margin:0;font-size:20px;line-height:26px;font-weight:700;letter-spacing:-0.02em;color:#FAFAFA;">Scaffdev</p>
              <p style="margin:6px 0 0;font-size:12px;line-height:18px;color:#A1A1AA;">Template komunitas &amp; starter kit Indonesia</p>
              <div style="margin-top:18px;width:44px;height:3px;background:#8B5CF6;border-radius:99px;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <span style="display:inline-block;padding:6px 11px;border-radius:999px;background:${copy.badgeBg};border:1px solid ${copy.badgeBorder};color:${copy.badgeColor};font-size:11px;line-height:14px;font-weight:700;letter-spacing:0.08em;">${copy.badge}</span>
              <h1 style="margin:18px 0 0;font-size:24px;line-height:32px;letter-spacing:-0.02em;color:#18181B;font-weight:700;">${escapeHtml(copy.title)}</h1>
              <p style="margin:14px 0 0;font-size:15px;line-height:25px;color:#3F3F46;">Halo ${safeAuthor},</p>
              <p style="margin:10px 0 0;font-size:15px;line-height:25px;color:#3F3F46;">${escapeHtml(copy.intro)}</p>
              <p style="margin:12px 0 0;font-size:15px;line-height:25px;color:#3F3F46;">${escapeHtml(copy.body)}</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0 0;background:#FAFAFA;border:1px solid #E4E4E7;border-radius:12px;">
                <tr><td style="padding:14px 18px;">
                  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                    ${summaryRow("Template", safeNama)}
                    ${summaryRow("Framework", safeFramework)}
                    ${summaryRow("Kategori", safeKategori)}
                    ${summaryRow("Status", escapeHtml(statusLabel))}
                    ${summaryRow("Tanggal", escapeHtml(tanggal))}
                  </table>
                </td></tr>
              </table>

              ${noteHtml}

              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
                <tr>
                  <td style="border-radius:10px;background:#8B5CF6;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:13px 22px;font-size:14px;line-height:20px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:10px;">${escapeHtml(copy.ctaLabel)}</a>
                  </td>
                </tr>
              </table>

              <h2 style="margin:30px 0 10px;font-size:13px;line-height:18px;letter-spacing:0.06em;text-transform:uppercase;color:#71717A;font-weight:700;">Langkah berikutnya</h2>
              <ul style="margin:0;padding:0 0 0 18px;">${stepsHtml}</ul>

              <p style="margin:24px 0 0;padding-top:20px;border-top:1px solid #E4E4E7;font-size:13px;line-height:21px;color:#71717A;">
                Email ini dikirim otomatis karena kamu mengirim submission template ke Scaffdev.
                Panduan lengkap ada di <a href="${siteUrl}/docs/cara-kontribusi-template" style="color:#7C3AED;text-decoration:underline;">dokumentasi kontribusi</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td style="background:#FAFAFA;border-top:1px solid #E4E4E7;padding:18px 32px;">
              <p style="margin:0;font-size:12px;line-height:18px;color:#A1A1AA;">
                © ${new Date().getFullYear()} Scaffdev · <a href="${siteUrl}" style="color:#71717A;text-decoration:none;">${siteUrl.replace(/^https?:\/\//, "")}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textLines = [
    `Halo ${author},`,
    "",
    copy.intro,
    "",
    copy.body,
    "",
    "Ringkasan submission",
    `- Template: ${nama}`,
    `- Framework: ${formatFramework(input.framework)}`,
    `- Kategori: ${formatKategori(input.kategori)}`,
    `- Status: ${statusLabel}`,
    `- Tanggal: ${tanggal}`,
  ];
  if (note) {
    textLines.push("", "Catatan dari tim:", note);
  } else if (input.event === "needs_revision") {
    textLines.push(
      "",
      "Belum ada catatan rinci dari tim. Cek kembali kelengkapan repo, demo, screenshot, dan data submission sebelum mengirim ulang."
    );
  }
  textLines.push(
    "",
    "Langkah berikutnya:",
    ...copy.steps.map((step, index) => `${index + 1}. ${step}`),
    "",
    `${copy.ctaLabel}: ${ctaUrl}`,
    "",
    "Email ini dikirim otomatis karena kamu mengirim submission template ke Scaffdev.",
    `Panduan kontribusi: ${absolute("/docs/cara-kontribusi-template")}`,
    "",
    "Salam,",
    "Tim Scaffdev",
    SITE_URL
  );

  return { subject, html, text: textLines.join("\n") };
}
