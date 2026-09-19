import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

/**
 * Origin yang boleh mengakses /api lintas situs.
 * Diisi via env CORS_ALLOWED_ORIGINS (koma, tanpa trailing slash),
 * mis. "https://scaffdev.vercel.app,https://admin-scaffdev.vercel.app".
 * Kosong = perilaku lama (refleksikan origin peminta) agar dev lokal
 * (port 3000/3001 berbeda) tetap jalan tanpa konfigurasi.
 */
function allowedOrigin(requestOrigin: string | null): string {
  const configured = (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((s) => s.trim().replace(/\/+$/, ""))
    .filter(Boolean);
  if (configured.length === 0) return requestOrigin ?? "*";
  if (requestOrigin && configured.includes(requestOrigin.replace(/\/+$/, ""))) {
    return requestOrigin;
  }
  // Origin tak dikenal: kembalikan origin pertama yang dikonfigurasi
  // (browser tetap memblokir pembacaan lintas origin yang tak cocok).
  return configured[0];
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "*";
  const isPreflight = request.method === "OPTIONS";
  const path = request.nextUrl.pathname;

  // Admin panel lives in apps/admin (port 3001) dengan Supabase Auth sendiri.
  // Tidak ada route /admin di app ini — hanya CORS untuk /api.

  if (isPreflight) {
    return NextResponse.json(
      {},
      {
        headers: {
          "Access-Control-Allow-Origin": allowedOrigin(origin),
          ...corsOptions,
        },
      }
    );
  }

  const response = NextResponse.next();
  if (path.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin(origin));
    Object.entries(corsOptions).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
}

export const config = {
  matcher: ["/api/:path*"],
};