import { NextResponse } from "next/server";

/**
 * JSON Schema untuk scaff.template.json (manifest template).
 * Cerminan aturan packages/cli/src/lib/manifest.ts (parseTemplateManifest).
 * Dirujuk via "$schema" di contoh template agar editor memberi autocomplete.
 */
const SCHEMA = {
  $schema: "http://json-schema.org/draft-07/schema#",
  $id: "https://scaffdev.vercel.app/schemas/scaff.template.json",
  title: "Scaffdev Template Manifest",
  description:
    "Peta file milik integrasi dalam sebuah template (provides) + panduan copotnya (removalGuides). Setiap key di provides wajib punya pasangan di removalGuides.",
  type: "object",
  required: ["name", "slug", "framework"],
  properties: {
    name: {
      type: "string",
      minLength: 1,
      description: "Nama tampil template.",
    },
    slug: {
      type: "string",
      pattern: "^[a-z0-9]+(?:-[a-z0-9]+)*$",
      description: "Kode unik huruf kecil/dash.",
    },
    framework: {
      type: "string",
      description: "Kode framework (contoh: nextjs, laravel).",
    },
    provides: {
      type: "object",
      description: "Map kode integrasi ke array path file miliknya (path relatif aman, tanpa ..).",
      additionalProperties: {
        type: "array",
        minItems: 1,
        items: { type: "string", minLength: 1 },
      },
    },
    removalGuides: {
      type: "object",
      description: "Map kode integrasi ke file panduan copot (REMOVE-<KODE>.md).",
      additionalProperties: { type: "string", minLength: 1 },
    },
  },
  additionalProperties: true,
};

export async function GET() {
  return NextResponse.json(SCHEMA, {
    headers: { "Cache-Control": "public, max-age=86400" },
  });
}
