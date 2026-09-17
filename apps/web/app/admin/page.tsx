"use client";

import { useActionState, useState } from "react";
import { addTemplate } from "./template-actions";
import { logoutAction } from "./actions";

const KATEGORI = ["ecommerce", "landing-page", "portfolio"];
const INTEGRASI = ["supabase", "midtrans", "xendit", "rajaongkir"];

const initialState = {
  error: "",
  success: false
};

export default function AdminDashboard() {
  const [state, formAction, pending] = useActionState(async (prevState: any, formData: FormData) => {
    const integrasi = INTEGRASI.filter(i => formData.get(`int_${i}`) === "on");
    formData.set("opsi_integrasi", integrasi.join(","));
    
    const res = await addTemplate(formData);
    if (res?.error) {
      return { error: res.error, success: false };
    }
    return { error: "", success: true };
  }, initialState);

  return (
    <div className="min-h-screen bg-[#131316] text-white p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Admin Panel</h1>
          <form action={logoutAction}>
            <button className="text-sm text-zinc-400 hover:text-white transition-colors">
              Logout
            </button>
          </form>
        </div>

        <div className="bg-[#1C1C21] border border-[#26262B] p-6 rounded-xl shadow-xl">
          <h2 className="text-xl font-semibold mb-6">Tambah Template Baru</h2>
          
          {state.success && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg">
              Template berhasil ditambahkan! Silakan cek di CLI atau halaman templates.
            </div>
          )}
          
          {state.error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg">
              {state.error}
            </div>
          )}

          <form action={formAction} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Nama Template *</label>
                <input required name="nama" type="text" className="w-full bg-[#131316] border border-[#26262B] rounded-lg px-4 py-2" placeholder="E-commerce Pro" />
              </div>
              
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Slug (Kosongkan utk auto-generate)</label>
                <input name="slug" type="text" className="w-full bg-[#131316] border border-[#26262B] rounded-lg px-4 py-2" placeholder="ecommerce-pro-nextjs" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Kategori *</label>
                <select required name="kategori" className="w-full bg-[#131316] border border-[#26262B] rounded-lg px-4 py-2 text-white">
                  {KATEGORI.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Framework *</label>
                <select required name="framework" className="w-full bg-[#131316] border border-[#26262B] rounded-lg px-4 py-2 text-white">
                  <option value="nextjs">Next.js</option>
                  <option value="laravel">Laravel (Soon)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">URL Repo GitHub (Public) *</label>
              <input required name="repo_url" type="url" className="w-full bg-[#131316] border border-[#26262B] rounded-lg px-4 py-2" placeholder="https://github.com/scaff-dev/ecommerce.git" />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Deskripsi</label>
              <textarea name="deskripsi" rows={3} className="w-full bg-[#131316] border border-[#26262B] rounded-lg px-4 py-2" placeholder="Deskripsi singkat fitur template..."></textarea>
            </div>
            
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">URL Screenshot (Opsional)</label>
              <input name="screenshot_url" type="url" className="w-full bg-[#131316] border border-[#26262B] rounded-lg px-4 py-2" placeholder="https://imgur.com/xyz.jpg" />
            </div>

            <div>
              <label className="block text-sm text-zinc-400 mb-2.5">Opsi Integrasi</label>
              <div className="flex flex-wrap gap-4">
                {INTEGRASI.map(int => (
                  <label key={int} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" name={`int_${int}`} className="w-4 h-4 rounded border-[#26262B] bg-[#131316]" />
                    <span className="text-sm">{int}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <input type="checkbox" name="is_published" id="is_published" defaultChecked className="w-4 h-4 rounded border-[#26262B] bg-[#131316]" />
              <label htmlFor="is_published" className="text-sm text-zinc-300">Langsung Publish (Bisa diakses CLI & Web)</label>
            </div>

            <div className="pt-4">
              <button 
                type="submit" 
                disabled={pending}
                className="w-full bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50"
              >
                {pending ? "Menyimpan..." : "Simpan Template"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}