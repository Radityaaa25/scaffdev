import { Template, Integrasi, TemplateDetailResponse } from "@scaff/database";
import { supabase } from "./supabase";

export async function getAllTemplates(filters?: { kategori?: string; framework?: string }): Promise<Template[]> {
  let query = supabase.from("templates").select("*").eq("is_published", true);

  if (filters?.kategori && filters.kategori !== "all") {
    query = query.eq("kategori", filters.kategori);
  }
  if (filters?.framework && filters.framework !== "all") {
    query = query.eq("framework", filters.framework);
  }

  const { data, error } = await query;
  if (error) {
    console.error("Error fetching templates:", error);
    return [];
  }

  return data as Template[];
}

export async function getTemplateBySlug(slug: string): Promise<TemplateDetailResponse | null> {
  const { data: tpl, error: tplError } = await supabase
    .from("templates")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (tplError || !tpl) {
    if (tplError && tplError.code !== "PGRST116") {
      console.error("Error fetching template:", tplError);
    }
    return null;
  }

  const integrasiDetails = [];
  if (tpl.opsi_integrasi && tpl.opsi_integrasi.length > 0) {
    const { data: integrations, error: intError } = await supabase
      .from("integrasi")
      .select("*")
      .in("kode", tpl.opsi_integrasi);

    if (intError) {
      console.error("Error fetching integrations:", intError);
    } else if (integrations) {
      for (const item of integrations) {
        integrasiDetails.push({
          kode: item.kode,
          nama_tampilan: item.nama_tampilan,
          daftar_env_var: item.daftar_env_var,
          instruksi_setup: item.instruksi_setup,
          kategori_integrasi: item.kategori_integrasi ?? null,
          has_modul: Boolean(item.repo_url && String(item.repo_url).trim() !== ""),
        });
      }
    }
  }

  return {
    slug: tpl.slug,
    nama: tpl.nama,
    repo_url: tpl.repo_url,
    framework: tpl.framework,
    kategori: tpl.kategori,
    deskripsi: tpl.deskripsi ?? undefined,
    screenshot_url: tpl.screenshot_url ?? undefined,
    builder_hidden_kategoris: (tpl.builder_hidden_kategoris ?? []) as string[],
    integrasi: integrasiDetails,
  };
}
