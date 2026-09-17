"use server";

import { supabase } from "@/lib/supabase";
import { revalidatePath } from "next/cache";

export async function addTemplate(formData: FormData) {
  try {
    const nama = formData.get("nama") as string;
    let slug = formData.get("slug") as string;
    const framework = formData.get("framework") as string;
    const kategori = formData.get("kategori") as string;
    const repo_url = formData.get("repo_url") as string;
    const deskripsi = formData.get("deskripsi") as string;
    const screenshot_url = formData.get("screenshot_url") as string;
    const is_published = formData.get("is_published") === "on";
    
    const integrasiStr = formData.get("opsi_integrasi") as string;
    const opsi_integrasi = integrasiStr ? integrasiStr.split(",").map(i => i.trim()).filter(Boolean) : [];

    // Auto generate slug if not provided
    if (!slug) {
      slug = `${nama.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${framework}`.replace(/^-+|-+$/g, '');
    }

    const { data, error } = await supabase
      .from("templates")
      .insert([
        {
          slug,
          nama,
          framework,
          kategori,
          repo_url,
          deskripsi: deskripsi || null,
          screenshot_url: screenshot_url || null,
          opsi_integrasi,
          is_published,
        }
      ]);

    if (error) {
      console.error("Supabase error:", error);
      return { error: error.message };
    }

    revalidatePath("/templates");
    revalidatePath("/api/templates");
    
    return { success: true };
  } catch (err: any) {
    return { error: err.message };
  }
}