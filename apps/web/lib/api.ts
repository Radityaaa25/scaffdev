import { Template, TemplateDetailResponse } from "@scaff/database";

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "";
  }
  return process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
}

export async function fetchTemplates(filters?: {
  kategori?: string;
  framework?: string;
}): Promise<Template[]> {
  try {
    const params = new URLSearchParams();
    if (filters?.kategori && filters.kategori !== "all") {
      params.set("kategori", filters.kategori);
    }
    if (filters?.framework && filters.framework !== "all") {
      params.set("framework", filters.framework);
    }

    const qs = params.toString();
    const url = `${getApiBaseUrl()}/api/templates${qs ? `?${qs}` : ""}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      throw new Error(`Failed to fetch templates: ${res.statusText}`);
    }
    const data = await res.json();
    return data.templates || [];
  } catch (err) {
    console.error("Error fetching templates:", err);
    return [];
  }
}

export async function fetchTemplateBySlug(slug: string): Promise<TemplateDetailResponse | null> {
  try {
    const url = `${getApiBaseUrl()}/api/templates/${slug}`;
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch template detail: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    console.error(`Error fetching template ${slug}:`, err);
    return null;
  }
}