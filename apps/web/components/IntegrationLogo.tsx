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
 * Logo integrasi asli. `src` override dari DB (logo_assets); kosong = pakai
 * file bundled; kode tanpa file = ikon generik. Jangan karang path file.
 */
export function IntegrationLogo({
  kode,
  iconClassName = "h-6 w-6",
  wordmarkClassName = "h-5 w-auto",
  src,
}: {
  kode: string;
  iconClassName?: string;
  wordmarkClassName?: string;
  src?: string;
}) {
  const entry = LOGOS[kode.toLowerCase()];
  const resolved = src?.trim() || entry?.src;
  if (!resolved) return <PuzzleIcon className={iconClassName} />;
  const label = entry?.label ?? kode;
  const wordmark = entry?.wordmark ?? false;
  return (
    <img
      src={resolved}
      alt={`Logo ${label}`}
      loading="lazy"
      draggable={false}
      className={wordmark ? wordmarkClassName : `${iconClassName} shrink-0`}
    />
  );
}
