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
  repo_url: string;
  framework_compat: string[];
  docs_url: string;
  created_at: string;
}

export interface LogoAsset {
  key: string;
  label: string;
  url: string;
  kind: string;
}

export interface Framework {
  id: string;
  kode: string;
  nama_tampilan: string;
  created_at: string;
}

export interface Kategori {
  id: string;
  kode: string;
  nama_tampilan: string;
  created_at: string;
}

export interface Laporan {
  id: string;
  kategori: "bug" | "saran" | "lainnya";
  judul: string;
  isi: string;
  kontak: string;
  gambar_url: string;
  status: "baru" | "diproses" | "selesai";
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
  preview_url?: string | null;
  opsi_integrasi: string[];
  is_published: boolean;
  is_premium: boolean;
  is_community?: boolean;
  author_name?: string | null;
  author_url?: string | null;
  source_url?: string | null;
  audited_commit?: string | null;
  audited_at?: string | null;
  downloads_count: number;
  builder_hidden_kategoris: string[];
  builder_hidden: boolean;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  nama: string;
  framework: string;
  kategori: string;
  repo_url: string;
  preview_url: string | null;
  screenshot_url: string | null;
  deskripsi: string | null;
  author_name: string;
  author_url: string | null;
  contact_email: string;
  opsi_integrasi: string[];
  cla_accepted_at: string;
  status: "pending" | "auditing" | "needs_revision" | "accepted" | "rejected" | "published";
  audit_commit: string | null;
  audit_severity: "INFO" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | null;
  audit_report: unknown | null;
  reviewed_by: string | null;
  review_note: string | null;
  template_slug: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Payload response untuk GET /api/templates/:slug (dengan detail integrasi lengkap)
 */
export interface TemplateDetailResponse {
  slug: string;
  /** null untuk template premium (repo privat, unduh via tarball berlisensi). */
  repo_url: string | null;
  framework: string;
  is_premium: boolean;
  nama?: string;
  deskripsi?: string;
  kategori?: string;
  screenshot_url?: string;
  preview_url?: string;
  is_community?: boolean;
  author_name?: string | null;
  author_url?: string | null;
  source_url?: string | null;
  audited_commit?: string | null;
  audited_at?: string | null;
  builder_hidden_kategoris: string[];
  builder_hidden: boolean;
  integrasi: Array<{
    kode: string;
    nama_tampilan: string;
    daftar_env_var: EnvVar[];
    instruksi_setup?: string | null;
    kategori_integrasi?: string | null;
    has_modul: boolean;
  }>;
}

export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | string;
}

export interface License {
  id: string;
  key: string;
  template_slug: string;
  email: string;
  status: 'active' | 'revoked' | string;
  note: string;
  created_at: string;
}
