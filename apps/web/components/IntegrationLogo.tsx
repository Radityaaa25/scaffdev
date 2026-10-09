import { PuzzleIcon } from "./DocsIcons";

const LOGOS: Record<string, { src: string; label: string; wordmark?: boolean }> = {
  supabase: { src: "/logo-supabase.svg", label: "Supabase" },
  midtrans: { src: "/logo-midtrans.svg", label: "Midtrans", wordmark: true },
  xendit: { src: "/logo-xendit.svg", label: "Xendit" },
  duitku: { src: "/logo-duitku.svg", label: "Duitku", wordmark: true },
  cloudinary: { src: "/logo-cloudinary.svg", label: "Cloudinary" },
  resend: { src: "/logo-resend.svg", label: "Resend" },
  nextjs: { src: "/logo-nextjs.svg", label: "Next.js" },
  laravel: { src: "/logo-laravel.svg", label: "Laravel" },
  rajaongkir: { src: "/logo-rajaongkir.webp", label: "RajaOngkir", wordmark: true },
  fonnte: { src: "/logo-fonnte.png", label: "Fonnte", wordmark: true },
};

/**
 * Logo integrasi asli. Kode tanpa file logo fallback ke ikon generik.
 */

/**
 * Logo integrasi asli. Kode tanpa file logo fallback ke ikon generik —
 * jangan karang path file.
 */
export function IntegrationLogo({
  kode,
  iconClassName = "h-6 w-6",
  wordmarkClassName = "h-5 w-auto",
}: {
  kode: string;
  iconClassName?: string;
  wordmarkClassName?: string;
}) {
  const entry = LOGOS[kode.toLowerCase()];
  if (!entry) return <PuzzleIcon className={iconClassName} />;
  return (
    <img
      src={entry.src}
      alt={`Logo ${entry.label}`}
      loading="lazy"
      draggable={false}
      className={entry.wordmark ? wordmarkClassName : `${iconClassName} shrink-0`}
    />
  );
}
