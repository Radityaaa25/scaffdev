export interface EnvVar {
  key: string;
  deskripsi: string;
}

export interface IntegrasiDetail {
  kode: string;
  nama_tampilan: string;
  daftar_env_var: EnvVar[];
  instruksi_setup?: string | null;
}

export interface Template {
  id: string;
  slug: string;
  nama: string;
  framework: string;
  kategori: string;
  repo_url: string;
  deskripsi?: string | null;
  screenshot_url?: string | null;
  opsi_integrasi: string[];
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TemplateDetailResponse {
  slug: string;
  repo_url: string;
  framework: string;
  nama?: string;
  deskripsi?: string;
  kategori?: string;
  integrasi: IntegrasiDetail[];
}
