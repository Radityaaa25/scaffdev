import { NextResponse } from "next/server";
import { getAllDocs } from "@/lib/docs";

export async function GET() {
  // Daftar docs publik untuk global search (SiteSearch).
  try {
    const docs = getAllDocs();
    return NextResponse.json({ docs });
  } catch {
    return NextResponse.json({ error: "Gagal mengambil daftar docs." }, { status: 500 });
  }
}
