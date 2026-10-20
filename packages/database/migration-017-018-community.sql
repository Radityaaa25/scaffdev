-- ============================================================
-- Migrasi 017 + 018 — Preview URL + kontribusi komunitas
-- Jalankan SELURUH blok ini sekali di Supabase SQL Editor.
-- Sumber kanonik: packages/database/schema.sql (blok paling akhir).
-- ============================================================

alter table public.templates
  add column if not exists preview_url text,
  add column if not exists is_community boolean not null default false,
  add column if not exists author_name text,
  add column if not exists author_url text,
  add column if not exists source_url text,
  add column if not exists audited_commit text,
  add column if not exists audited_at timestamptz;

create table if not exists public.submissions (
  id                uuid        primary key default gen_random_uuid(),
  nama              text        not null,
  framework         text        not null,
  kategori          text        not null,
  repo_url          text        not null,
  preview_url       text,
  screenshot_url    text,
  deskripsi         text,
  author_name       text        not null,
  author_url        text,
  contact_email     text        not null,
  opsi_integrasi    text[]      not null default '{}',
  cla_accepted_at   timestamptz not null,
  status            text        not null default 'pending'
                    check (status in ('pending','auditing','needs_revision','accepted','rejected','published')),
  audit_commit      text,
  audit_severity    text        check (audit_severity in ('INFO','LOW','MEDIUM','HIGH','CRITICAL')),
  audit_report      jsonb,
  reviewed_by       text,
  review_note       text,
  template_slug     text        references public.templates(slug) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_submissions_status on public.submissions (status, created_at desc);
create index if not exists idx_submissions_created on public.submissions (created_at desc);

drop trigger if exists trg_submissions_set_updated_at on public.submissions;
create trigger trg_submissions_set_updated_at
  before update on public.submissions
  for each row execute function public.set_updated_at();

alter table public.submissions enable row level security;

drop policy if exists submissions_publik_insert on public.submissions;
create policy submissions_publik_insert
  on public.submissions
  for insert
  to anon, authenticated
  with check (status = 'pending' and cla_accepted_at is not null);

drop policy if exists submissions_admin_all on public.submissions;
create policy submissions_admin_all
  on public.submissions
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- Isi preview untuk 6 template yang sudah punya demo di scaffdev/previews.
-- Idempotent: tidak menimpa URL yang sudah diubah admin.
update public.templates
set preview_url = 'https://scaffdev.github.io/previews/' || slug || '/'
where slug in (
  'blog-nusantarakini-nextjs',
  'blog-sehatinfo-nextjs',
  'komunitas-wavebox-nextjs',
  'pos-posify-laravel',
  'ecommerce-dailydrink-laravel',
  'ecommerce-tokokita-laravel'
)
and (preview_url is null or preview_url = '');
