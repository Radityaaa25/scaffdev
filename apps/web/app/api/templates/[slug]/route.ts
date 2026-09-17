import { NextRequest, NextResponse } from "next/server";
import { getTemplateBySlug } from "@/lib/data";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;
  const template = await getTemplateBySlug(slug);

  if (!template) {
    return NextResponse.json(
      { error: "Template tidak ditemukan" },
      { status: 404 }
    );
  }

  return NextResponse.json(template);
}
