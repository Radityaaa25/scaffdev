import type { NextConfig } from "next";

// Header keamanan tanpa memengaruhi tampilan/fungsi (lihat apps/web).
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
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