import { NextRequest, NextResponse } from "next/server";
import { getAllTemplates } from "@/lib/data";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const kategori = searchParams.get("kategori") ?? undefined;
  const framework = searchParams.get("framework") ?? undefined;

  const templates = await getAllTemplates({ kategori, framework });

  return NextResponse.json({
    templates,
  });
}