import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const corsOptions = {
  "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export function middleware(request: NextRequest) {
  const origin = request.headers.get("origin") ?? "*";
  const isPreflight = request.method === "OPTIONS";
  const path = request.nextUrl.pathname;

  // Protect admin routes
  if (path.startsWith("/admin") && path !== "/admin/login") {
    const adminSession = request.cookies.get("admin_session")?.value;
    // VERY simple password check via cookie for MVP
    if (adminSession !== "authenticated") {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  if (isPreflight) {
    return NextResponse.json(
      {},
      {
        headers: {
          "Access-Control-Allow-Origin": origin,
          ...corsOptions,
        },
      }
    );
  }

  const response = NextResponse.next();
  if (path.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    Object.entries(corsOptions).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }
  return response;
}

export const config = {
  matcher: ["/api/:path*", "/admin/:path*"],
};