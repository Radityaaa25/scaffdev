import type { NextConfig } from "next";

// Header keamanan tanpa memengaruhi tampilan/fungsi:
// - anti-clickjacking (tidak ada halaman yang di-embed iframe),
// - cegah MIME-sniffing, referrer minimal,
// - HSTS: paksa HTTPS selama 1 tahun (platform sudah serve HTTPS,
//   header ini mencegah downgrade/strip SSL oleh client),
// - Permissions-Policy: matikan API yang tidak dipakai situs ini
//   (kamera/mikrofon/lokasi/geolokasi) — mencegah eksekusi tak perlu.
// (CSP disengaja tidak dipasang agar tidak merusak inline script/style Next.js.)
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig: NextConfig = {
  transpilePackages: ["@scaff/ui"],
  // W3: sembunyikan fingerprint framework dari header respons.
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;