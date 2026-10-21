import type { MetadataRoute } from "next";
import { getAllDocs } from "@/lib/docs";
import { getAllTemplates } from "@/lib/data";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

/** Sitemap dinamis: halaman statis + katalog template + seluruh docs. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/templates"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/docs"), changeFrequency: "weekly", priority: 0.9 },
    { url: absoluteUrl("/lapor"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/kontribusi"), changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/builder"), changeFrequency: "monthly", priority: 0.5 },
  ];

  let templates: MetadataRoute.Sitemap = [];
  try {
    const rows = await getAllTemplates();
    templates = rows.map((t) => ({
      url: absoluteUrl(`/templates/${t.slug}`),
      lastModified: t.updated_at ? new Date(t.updated_at) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    templates = [];
  }

  let docs: MetadataRoute.Sitemap = [];
  try {
    docs = getAllDocs().map((d) => ({
      url: absoluteUrl(`/docs/${d.slug}`),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));
  } catch {
    docs = [];
  }

  return [...staticPages, ...templates, ...docs];
}
