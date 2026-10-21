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
const EMAIL_FONT =
  "'Inter','Segoe UI','Helvetica Neue',Helvetica,Arial,sans-serif";

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
    <td style="padding:9px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#78716C;width:132px;vertical-align:top;">${label}</td>
    <td style="padding:9px 0;font-family:${EMAIL_FONT};font-size:13px;line-height:20px;color:#1C1917;font-weight:600;vertical-align:top;">${value}</td>
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
  const logoUrl = escapeHtml(absolute("/logo-full-email.png"));

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
      (step, index) =>
        `<tr>
          <td width="30" valign="top" style="padding:0 10px 12px 0;">
            <span style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:6px;background:#F5F3FF;color:#6D28D9;font-family:${EMAIL_FONT};font-size:11px;font-weight:700;text-align:center;">${index + 1}</span>
          </td>
          <td valign="top" style="padding:0 0 12px;font-family:${EMAIL_FONT};font-size:14px;line-height:22px;color:#44403C;">${escapeHtml(step)}</td>
        </tr>`
    )
    .join("");

  const noteHtml = note
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;border-collapse:collapse;background:#FAF5FF;border:1px solid #E9D5FF;border-left:3px solid #8B5CF6;border-radius:10px;">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0 0 6px;font-family:${EMAIL_FONT};font-size:11px;line-height:16px;letter-spacing:0.08em;text-transform:uppercase;color:#7E22CE;font-weight:700;">Catatan dari tim</p>
          <p style="margin:0;font-family:${EMAIL_FONT};font-size:14px;line-height:23px;color:#44403C;">${safeNote}</p>
        </td></tr>
      </table>`
    : input.event === "needs_revision"
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;border-collapse:collapse;background:#FAF5FF;border:1px solid #E9D5FF;border-left:3px solid #8B5CF6;border-radius:10px;">
        <tr><td style="padding:16px 18px;">
          <p style="margin:0;font-family:${EMAIL_FONT};font-size:14px;line-height:23px;color:#44403C;">Belum ada catatan rinci dari tim. Cek kembali kelengkapan repo, demo, screenshot, dan data submission sebelum mengirim ulang.</p>
        </td></tr>
      </table>`
      : "";

  const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="color-scheme" content="light" />
  <meta name="supported-color-schemes" content="light" />
  <title>${escapeHtml(subject)}</title>
  <style>
    @media only screen and (max-width: 480px) {
      .email-outer { padding: 20px 12px !important; }
      .email-pad { padding-left: 22px !important; padding-right: 22px !important; }
      .email-logo { width: 140px !important; height: auto !important; }
      .email-hide { display: none !important; }
      .email-title { font-size: 23px !important; line-height: 31px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background:#F4F4F2;font-family:${EMAIL_FONT};color:#1C1917;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(copy.intro)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="email-outer" style="border-collapse:collapse;background:#F4F4F2;padding:36px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#FFFFFF;border:1px solid #E7E5E4;border-radius:14px;overflow:hidden;">
          <tr>
            <td style="height:4px;background:#8B5CF6;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:26px 36px 22px;border-bottom:1px solid #F0EFED;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                <tr>
                  <td align="left" valign="middle">
                    <img src="${logoUrl}" width="160" height="68" alt="Scaffdev" class="email-logo" style="display:block;width:160px;height:auto;border:0;outline:none;text-decoration:none;" />
                  </td>
                  <td align="right" valign="middle" class="email-hide" style="font-family:${EMAIL_FONT};font-size:10px;line-height:14px;letter-spacing:0.12em;text-transform:uppercase;color:#A8A29E;font-weight:600;">
                    Template komunitas
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="padding:34px 36px 32px;">
              <span style="display:inline-block;padding:6px 11px;border-radius:999px;background:${copy.badgeBg};border:1px solid ${copy.badgeBorder};color:${copy.badgeColor};font-family:${EMAIL_FONT};font-size:11px;line-height:14px;font-weight:700;letter-spacing:0.08em;">${copy.badge}</span>
              <h1 class="email-title" style="margin:18px 0 0;font-family:${EMAIL_FONT};font-size:26px;line-height:34px;letter-spacing:-0.02em;color:#18181B;font-weight:700;">${escapeHtml(copy.title)}</h1>
              <p style="margin:16px 0 0;font-family:${EMAIL_FONT};font-size:15px;line-height:26px;color:#44403C;">Halo ${safeAuthor},</p>
              <p style="margin:8px 0 0;font-family:${EMAIL_FONT};font-size:15px;line-height:26px;color:#44403C;">${escapeHtml(copy.intro)}</p>
              <p style="margin:12px 0 0;font-family:${EMAIL_FONT};font-size:15px;line-height:26px;color:#44403C;">${escapeHtml(copy.body)}</p>

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0 0;border-collapse:collapse;background:#FAFAF9;border:1px solid #E7E5E4;border-radius:10px;">
                <tr>
                  <td style="padding:14px 20px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
                      ${summaryRow("Template", safeNama)}
                      ${summaryRow("Framework", safeFramework)}
                      ${summaryRow("Kategori", safeKategori)}
                      ${summaryRow("Status", escapeHtml(statusLabel))}
                      ${summaryRow("Tanggal", escapeHtml(tanggal))}
                    </table>
                  </td>
                </tr>
              </table>

              ${noteHtml}

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;border-collapse:collapse;">
                <tr>
                  <td style="border-radius:8px;background:#7C3AED;">
                    <a href="${ctaUrl}" style="display:inline-block;padding:13px 24px;font-family:${EMAIL_FONT};font-size:14px;line-height:20px;font-weight:600;color:#FFFFFF;text-decoration:none;border-radius:8px;">${escapeHtml(copy.ctaLabel)}</a>
                  </td>
                </tr>
              </table>

              <h2 style="margin:30px 0 12px;font-family:${EMAIL_FONT};font-size:11px;line-height:16px;letter-spacing:0.1em;text-transform:uppercase;color:#78716C;font-weight:700;">Langkah berikutnya</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${stepsHtml}</table>

              <p style="margin:22px 0 0;padding-top:22px;border-top:1px solid #E7E5E4;font-family:${EMAIL_FONT};font-size:12px;line-height:20px;color:#78716C;">
                Email ini dikirim otomatis karena kamu mengirim submission template ke Scaffdev.
                Panduan lengkap ada di <a href="${siteUrl}/docs/cara-kontribusi-template" style="color:#6D28D9;text-decoration:underline;">dokumentasi kontribusi</a>.
              </p>
            </td>
          </tr>
          <tr>
            <td class="email-pad" style="background:#FAFAF9;border-top:1px solid #E7E5E4;padding:20px 36px;">
              <p style="margin:0;font-family:${EMAIL_FONT};font-size:12px;line-height:19px;color:#78716C;font-weight:600;">Scaffdev</p>
              <p style="margin:3px 0 0;font-family:${EMAIL_FONT};font-size:12px;line-height:19px;color:#A8A29E;">
                Template komunitas &amp; starter kit Indonesia · <a href="${siteUrl}" style="color:#6D28D9;text-decoration:none;">${siteUrl.replace(/^https?:\/\//, "")}</a>
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
