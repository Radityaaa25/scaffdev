-- ============================================================
-- Scaff — Skema Database Supabase (Postgres)
-- Sumber kebenaran: docs/03-database-architecture.md
--
-- Catatan: database ini HANYA menyimpan metadata template
-- (slug, repo_url, deskripsi, dll). Isi kode template selalu di
-- GitHub — database hanya menyimpan referensi ke sana.
-- ============================================================

-- ------------------------------------------------------------
-- Tabel: templates
-- ------------------------------------------------------------
create table if not exists public.templates (
  id               uuid        primary key default gen_random_uuid(),
  slug             text        not null unique,
  nama             text        not null,
  framework        text        not null,           -- contoh: 'nextjs', 'laravel'
  kategori         text        not null,           -- contoh: 'ecommerce', 'landing-page', 'portfolio'
  repo_url         text        not null,           -- Wajib repo PUBLIC untuk MVP
  deskripsi        text,
  screenshot_url   text,
  opsi_integrasi   text[]      not null default '{}',  -- merujuk ke integrasi.kode secara logis
  is_published     boolean     not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabel: integrasi
-- Referensi untuk menggabungkan .env.example & SETUP.md secara dinamis.
-- ------------------------------------------------------------
create table if not exists public.integrasi (
  id                  uuid      primary key default gen_random_uuid(),
  kode                text      not null unique,      -- contoh: 'supabase', 'midtrans'
  nama_tampilan       text      not null,             -- contoh: 'Supabase'
  kategori_integrasi  text,                           -- contoh: 'database', 'payment', 'auth'
  daftar_env_var      jsonb     not null default '[]'::jsonb,
  instruksi_setup     text,                           -- markdown, digabung ke SETUP.md
  created_at          timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Tabel: admin_users
-- Extension dari auth.users bawaan Supabase. TIDAK ada akses publik.
-- ------------------------------------------------------------
create table if not exists public.admin_users (
  id     uuid   primary key references auth.users (id) on delete cascade,
  email  text   not null unique,
  role   text   not null default 'admin'    -- MVP hanya satu role, siap ekspansi
);

-- ============================================================
-- Indexing (docs/03-database-architecture.md)
-- ============================================================
create index if not exists idx_templates_kategori  on public.templates (kategori);
create index if not exists idx_templates_framework on public.templates (framework);
create index if not exists idx_templates_published on public.templates (is_published);

-- ============================================================
-- Trigger: updated_at (templates)
-- ============================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_templates_set_updated_at on public.templates;
create trigger trg_templates_set_updated_at
  before update on public.templates
  for each row execute function public.set_updated_at();

-- ============================================================
-- Helper: is_admin()
-- Security definer agar pengecekan admin tidak jatuh pada RLS
-- tabel admin_users (yang memang sengaja tanpa akses publik).
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid()
  );
$$;

-- ============================================================
-- Row Level Security (docs/03-database-architecture.md)
--
-- Prinsip:
--  - templates & integrasi : read publik untuk template yang
--    is_published = true. Write hanya untuk admin yang terautentikasi.
--  - admin_users            : hanya diakses service role (backend).
--    Tidak ada policy publik sama sekali.
-- ============================================================
alter table public.templates enable row level security;
alter table public.integrasi enable row level security;
alter table public.admin_users enable row level security;

-- templates — read publik hanya untuk yang terpublikasi
drop policy if exists templates_publik_read on public.templates;
create policy templates_publik_read
  on public.templates
  for select
  using (is_published = true);

-- templates — seluruh operasi admin
drop policy if exists templates_admin_all on public.templates;
create policy templates_admin_all
  on public.templates
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- integrasi — read publik (referensi .env/SETUP.md harus bisa dibaca publik)
drop policy if exists integrasi_publik_read on public.integrasi;
create policy integrasi_publik_read
  on public.integrasi
  for select
  using (true);

-- integrasi — seluruh operasi admin
drop policy if exists integrasi_admin_all on public.integrasi;
create policy integrasi_admin_all
  on public.integrasi
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- admin_users — TANPA policy apapun (default deny). Hanya service role.