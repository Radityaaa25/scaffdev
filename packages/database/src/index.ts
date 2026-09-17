/**
 * Shared Database Types for Scaff
 * Sumber kebenaran: docs/03-database-architecture.md & packages/database/schema.sql
 */

export interface EnvVar {
  key: string;
  deskripsi: string;
}

export interface Integrasi {
  id: string;
  kode: string;
  nama_tampilan: string;
  kategori_integrasi?: string | null;
  daftar_env_var: EnvVar[];
  instruksi_setup?: string | null;
  created_at: string;
}

export interface Template {
  id: string;
  slug: string;
  nama: string;
  framework: 'nextjs' | 'laravel' | string;
  kategori: 'ecommerce' | 'landing-page' | 'portfolio' | string;
  repo_url: string;
  deskripsi?: string | null;
  screenshot_url?: string | null;
  opsi_integrasi: string[];
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Payload response untuk GET /api/templates/:slug (dengan detail integrasi lengkap)
 */
export interface TemplateDetailResponse {
  slug: string;
  repo_url: string;
  framework: string;
  nama?: string;
  deskripsi?: string;
  kategori?: string;
  screenshot_url?: string;
  integrasi: Array<{
    kode: string;
    nama_tampilan: string;
    daftar_env_var: EnvVar[];
    instruksi_setup?: string | null;
  }>;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | string;
}
