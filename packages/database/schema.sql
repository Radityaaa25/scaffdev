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

-- ============================================================
-- Migrasi 001 — Statistik generate via CLI
-- downloads_count naik setiap CLI mengambil detail template
-- (GET /api/templates/:slug?source=cli). Kolom ini BOLEH
-- ditambah (increment) oleh role anon/authenticated lewat RPC
-- aman di bawah; read mengikuti policy templates yang sudah ada.
-- ============================================================
alter table public.templates
  add column if not exists downloads_count integer not null default 0;

-- Optimasi performa RLS (Supabase best practice): bungkus auth.uid()
-- dalam SELECT agar dievaluasi sekali per query, bukan per baris.
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
    where id = (select auth.uid())
  );
$$;

-- RPC increment yang aman dipanggil publik/CLI tanpa auth:
-- hanya menambah counter, tidak membaca/menulis data lain.
-- Dibuat SECURITY DEFINER agar melewati RLS (hanya UPDATE kolom
-- counter pada baris yang sudah terpublikasi), dan granted ke anon.
create or replace function public.increment_template_downloads(p_slug text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.templates
  set downloads_count = downloads_count + 1
  where slug = p_slug
    and is_published = true;
end;
$$;

revoke all on function public.increment_template_downloads(text) from public;
grant execute on function public.increment_template_downloads(text) to anon, authenticated;

-- ============================================================
-- Seed 001 — Data referensi integrasi (konteks Indonesia)
-- Dipakai admin (toggle integrasi di form) dan CLI (generate
-- .env.example + SETUP.md). Idempotent: aman di-run ulang.
-- ============================================================
insert into public.integrasi (kode, nama_tampilan, kategori_integrasi, daftar_env_var, instruksi_setup)
values
  ('supabase', 'Supabase', 'database',
   '[{"key": "NEXT_PUBLIC_SUPABASE_URL", "deskripsi": "URL project Supabase"}, {"key": "NEXT_PUBLIC_SUPABASE_ANON_KEY", "deskripsi": "Anon key project Supabase"}]'::jsonb,
   '## Setup Supabase
1. Buat project gratis di https://supabase.com/dashboard
2. Buka Settings → API, salin URL dan anon key
3. Tempel ke file `.env.local`'),
  ('midtrans', 'Midtrans', 'payment',
   '[{"key": "MIDTRANS_SERVER_KEY", "deskripsi": "Server key Midtrans"}, {"key": "MIDTRANS_CLIENT_KEY", "deskripsi": "Client key Midtrans"}]'::jsonb,
   '## Setup Midtrans
1. Daftar di https://dashboard.midtrans.com
2. Ambil Server Key & Client Key (mode Sandbox untuk testing)
3. Tempel ke file `.env.local`'),
  ('xendit', 'Xendit', 'payment',
   '[{"key": "XENDIT_SECRET_KEY", "deskripsi": "Secret key Xendit"}]'::jsonb,
   '## Setup Xendit
1. Daftar di https://dashboard.xendit.co
2. Ambil Secret Key (mode test untuk pengembangan)
3. Tempel ke file `.env.local`'),
  ('rajaongkir', 'RajaOngkir', 'shipping',
   '[{"key": "RAJAONGKIR_API_KEY", "deskripsi": "API key RajaOngkir"}]'::jsonb,
   '## Setup RajaOngkir
1. Daftar di https://rajaongkir.com
2. Ambil API key dari dashboard
3. Tempel ke file `.env.local`')
on conflict (kode) do update set
  nama_tampilan   = excluded.nama_tampilan,
  kategori_integrasi = excluded.kategori_integrasi,
  daftar_env_var  = excluded.daftar_env_var,
  instruksi_setup = excluded.instruksi_setup;

-- ============================================================
-- Migrasi 002 — Log aktivitas + helper manajemen admin
-- activity_log: jejak siapa melakukan apa (create/update/delete)
-- pada template/integrasi/admin. Write HANYA via SECURITY DEFINER
-- log_activity() (tidak ada policy insert) agar actor tercatat
-- dari session terverifikasi server-side, bukan input client.
-- ============================================================
create table if not exists public.activity_log (
  id          uuid        primary key default gen_random_uuid(),
  actor_email text        not null,
  action      text        not null,   -- contoh: template.create, integrasi.delete
  entity      text        not null,   -- template | integrasi | admin
  entity_ref  text        not null default '',
  detail      text,
  created_at  timestamptz not null default now()
);

alter table public.activity_log enable row level security;

drop policy if exists activity_log_admin_read on public.activity_log;
create policy activity_log_admin_read
  on public.activity_log
  for select
  using (public.is_admin());

create index if not exists idx_activity_log_created on public.activity_log (created_at desc);

create or replace function public.log_activity(
  p_actor_email text,
  p_action text,
  p_entity text,
  p_entity_ref text,
  p_detail text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Hanya admin yang boleh mencatat (dipanggil server-side pasca mutasi).
  if not public.is_admin() then
    raise exception 'forbidden: bukan admin';
  end if;
  insert into public.activity_log (actor_email, action, entity, entity_ref, detail)
  values (p_actor_email, p_action, p_entity, p_entity_ref, p_detail);
end;
$$;

revoke all on function public.log_activity(text, text, text, text, text) from public;
grant execute on function public.log_activity(text, text, text, text, text) to authenticated;

-- ============================================================
-- Helper manajemen admin (dipakai halaman Admin).
-- Dieksekusi sebagai definer agar bisa membaca auth.users &
-- menulis admin_users; setiap fungsi memverifikasi is_admin()
-- terlebih dahulu — aman walau EXECUTE dibuka ke authenticated.
-- ============================================================
create or replace function public.admin_list()
returns table (id uuid, email text, role text)
language sql
security definer
set search_path = public
stable
as $$
  select a.id, a.email, a.role
  from public.admin_users a
  where public.is_admin()
  order by a.email;
$$;

revoke all on function public.admin_list() from public;
grant execute on function public.admin_list() to authenticated;

create or replace function public.admin_add_by_email(p_email text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_admin() then
    raise exception 'forbidden: bukan admin';
  end if;
  select u.id into v_id
  from auth.users u
  where lower(u.email) = lower(trim(p_email));
  if v_id is null then
    raise exception 'user dengan email tersebut belum terdaftar di Authentication — buat dulu lewat dashboard';
  end if;
  insert into public.admin_users (id, email, role)
  values (v_id, lower(trim(p_email)), 'admin')
  on conflict (id) do update set email = excluded.email;
  return v_id;
end;
$$;

revoke all on function public.admin_add_by_email(text) from public;
grant execute on function public.admin_add_by_email(text) to authenticated;

create or replace function public.admin_remove(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'forbidden: bukan admin';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'tidak bisa menghapus akun sendiri';
  end if;
  if (select count(*) from public.admin_users) <= 1 then
    raise exception 'tidak bisa menghapus admin terakhir';
  end if;
  delete from public.admin_users where id = p_user_id;
end;
$$;

revoke all on function public.admin_remove(uuid) from public;
grant execute on function public.admin_remove(uuid) to authenticated;

-- ============================================================
-- Migrasi 003 — Riwayat chat AI admin (retensi 30 hari)
-- Sesi kedaluwarsa 30 hari setelah aktivitas terakhir (sliding).
-- Pembersihan dilakukan malas (lazy purge) di endpoint daftar sesi —
-- tanpa cron/extension tambahan. Hapus sesi = cascade ke pesannya.
-- RLS: hanya admin (baca/tulis penuh), tanpa akses publik.
-- ============================================================
create table if not exists public.ai_chat_sessions (
  id         uuid        primary key default gen_random_uuid(),
  title      text        not null default 'Percakapan baru',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 days')
);

create table if not exists public.ai_chat_messages (
  id         uuid        primary key default gen_random_uuid(),
  session_id uuid        not null references public.ai_chat_sessions (id) on delete cascade,
  role       text        not null check (role in ('user', 'assistant')),
  content    text        not null,
  created_at timestamptz not null default now()
);

alter table public.ai_chat_sessions enable row level security;
alter table public.ai_chat_messages enable row level security;

drop policy if exists ai_chat_sessions_admin_all on public.ai_chat_sessions;
create policy ai_chat_sessions_admin_all
  on public.ai_chat_sessions
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists ai_chat_messages_admin_all on public.ai_chat_messages;
create policy ai_chat_messages_admin_all
  on public.ai_chat_messages
  for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_ai_chat_messages_session on public.ai_chat_messages (session_id, created_at);
create index if not exists idx_ai_chat_sessions_expires on public.ai_chat_sessions (expires_at);

-- ============================================================
-- Migrasi 004 — Log pemakaian AI (monitoring token & error)
-- Satu baris per request ke Groq, dari admin maupun user (nanti).
-- Kolom scope + model disiapkan agar pemisahan AI admin vs user
-- (key/model berbeda) tinggal konfigurasi, tanpa ubah skema.
-- RLS: hanya admin.
-- ============================================================
create table if not exists public.ai_usage_log (
  id                uuid        primary key default gen_random_uuid(),
  scope             text        not null default 'admin' check (scope in ('admin', 'user')),
  model             text        not null default '',
  prompt_tokens     integer     not null default 0,
  completion_tokens integer     not null default 0,
  total_tokens      integer     not null default 0,
  latency_ms        integer     not null default 0,
  status            text        not null default 'ok' check (status in ('ok', 'error')),
  error             text,
  session_ref       text        not null default '',
  created_at        timestamptz not null default now()
);

alter table public.ai_usage_log enable row level security;

drop policy if exists ai_usage_log_admin_all on public.ai_usage_log;
create policy ai_usage_log_admin_all
  on public.ai_usage_log
  for all
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_ai_usage_log_created on public.ai_usage_log (created_at desc);

-- ============================================================
-- Migrasi 005 — Bucket Storage untuk screenshot template
-- Dipakai form admin (upload file gambar). CARA PAKAI: jalankan
-- blok ini sekali di Supabase SQL Editor, lalu upload dari
-- halaman admin Templates. Tanpa blok ini, upload gagal dengan
-- pesan "bucket belum siap" dan admin tetap bisa isi URL manual.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('template-screenshots', 'template-screenshots', true)
on conflict (id) do nothing;

drop policy if exists screenshots_public_read on storage.objects;
create policy screenshots_public_read
  on storage.objects
  for select
  using (bucket_id = 'template-screenshots');

drop policy if exists screenshots_admin_write on storage.objects;
create policy screenshots_admin_write
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'template-screenshots'
    and public.is_admin()
  );

drop policy if exists screenshots_admin_update on storage.objects;
create policy screenshots_admin_update
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'template-screenshots' and public.is_admin())
  with check (bucket_id = 'template-screenshots');

drop policy if exists screenshots_admin_delete on storage.objects;
create policy screenshots_admin_delete
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'template-screenshots' and public.is_admin());

-- ============================================================
-- Migrasi 006 — Referensi framework & kategori (dikelola admin)
-- Form template HANYA boleh memilih dari tabel ini (tidak ada
-- ketik bebas). CLI/web/validasi membaca daftar yang sama.
-- CARA PAKAI: jalankan blok ini sekali di Supabase SQL Editor.
-- ============================================================
create table if not exists public.frameworks (
  id            uuid        primary key default gen_random_uuid(),
  kode          text        not null unique,   -- contoh: 'nextjs', 'laravel'
  nama_tampilan text        not null,          -- contoh: 'Next.js'
  created_at    timestamptz not null default now()
);

create table if not exists public.kategoris (
  id            uuid        primary key default gen_random_uuid(),
  kode          text        not null unique,   -- contoh: 'ecommerce'
  nama_tampilan text        not null,          -- contoh: 'E-commerce'
  created_at    timestamptz not null default now()
);

alter table public.frameworks enable row level security;
alter table public.kategoris enable row level security;

-- Read publik (filter katalog web + dropdown CLI honest).
drop policy if exists frameworks_publik_read on public.frameworks;
create policy frameworks_publik_read
  on public.frameworks
  for select
  using (true);

drop policy if exists kategoris_publik_read on public.kategoris;
create policy kategoris_publik_read
  on public.kategoris
  for select
  using (true);

-- Write hanya admin.
drop policy if exists frameworks_admin_all on public.frameworks;
create policy frameworks_admin_all
  on public.frameworks
  for all
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists kategoris_admin_all on public.kategoris;
create policy kategoris_admin_all
  on public.kategoris
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed nilai yang sudah dipakai selama ini. Idempotent.
insert into public.frameworks (kode, nama_tampilan)
values
  ('nextjs', 'Next.js'),
  ('laravel', 'Laravel')
on conflict (kode) do nothing;

insert into public.kategoris (kode, nama_tampilan)
values
  ('ecommerce', 'E-commerce'),
  ('landing-page', 'Landing Page'),
  ('portfolio', 'Portfolio')
on conflict (kode) do nothing;

-- ============================================================
-- Migrasi 007 — Laporan/pengaduan user (bug, saran, lainnya)
-- Form publik di /lapor (tanpa login). Baca/ubah/hapus HANYA admin.
-- CARA PAKAI: jalankan blok ini sekali di Supabase SQL Editor.
-- ============================================================
create table if not exists public.laporan (
  id         uuid        primary key default gen_random_uuid(),
  kategori   text        not null check (kategori in ('bug', 'saran', 'lainnya')),
  judul      text        not null,
  isi        text        not null,
  kontak     text        not null default '',
  status     text        not null default 'baru' check (status in ('baru', 'diproses', 'selesai')),
  created_at timestamptz not null default now()
);

alter table public.laporan enable row level security;

-- Publik: hanya boleh INSERT (melapor). Tidak bisa baca/ubah/hapus.
drop policy if exists laporan_publik_insert on public.laporan;
create policy laporan_publik_insert
  on public.laporan
  for insert
  to anon, authenticated
  with check (true);

-- Admin: akses penuh.
drop policy if exists laporan_admin_all on public.laporan;
create policy laporan_admin_all
  on public.laporan
  for all
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create index if not exists idx_laporan_status on public.laporan (status, created_at desc);

-- ============================================================
-- Migrasi 008 — Kolom gambar bukti laporan user (opsional)
-- CARA PAKAI: jalankan blok ini sekali di Supabase SQL Editor.
-- ============================================================
alter table public.laporan
  add column if not exists gambar_url text not null default '';

-- Upload bukti laporan oleh publik (tanpa login): anon hanya boleh INSERT
-- ke folder laporan/ — tidak bisa baca/ubah/hapus, tidak bisa tulis ke
-- folder lain (mis. screenshot template milik admin).
drop policy if exists screenshots_laporan_anon_insert on storage.objects;
create policy screenshots_laporan_anon_insert
  on storage.objects
  for insert
  to anon, authenticated
  with check (
    bucket_id = 'template-screenshots'
    and (storage.foldername(name))[1] = 'laporan'
  );

-- ============================================================
-- Migrasi 009 — Audit login admin (sukses+gagal, W5)
-- Read HANYA admin via dashboard/SQL. Write via SECURITY DEFINER
-- log_login_attempt() agar bisa dipanggil publik tanpa login
-- (dengan guard anti-spam di dalam fungsi).
-- CARA PAKAI: jalankan blok ini sekali di Supabase SQL Editor.
-- ============================================================
create table if not exists public.login_audit (
  id         uuid        primary key default gen_random_uuid(),
  email      text        not null,
  success    boolean     not null,
  created_at timestamptz not null default now()
);

alter table public.login_audit enable row level security;

-- TANPA policy publik: default deny. Baca hanya admin:
drop policy if exists login_audit_admin_read on public.login_audit;
create policy login_audit_admin_read
  on public.login_audit
  for select
  to authenticated
  using (public.is_admin());

create index if not exists idx_login_audit_created on public.login_audit (created_at desc);
create index if not exists idx_login_audit_email on public.login_audit (email, created_at desc);

create or replace function public.log_login_attempt(p_email text, p_success boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Validasi minimal + anti-spam per email (20/menit) agar tabel
  -- tidak bisa dibanjiri dari endpoint publik.
  if p_email is null or p_email = '' or length(p_email) > 320 then
    raise exception 'bad email';
  end if;
  if (select count(*) from public.login_audit
      where email = p_email and created_at > now() - interval '1 minute') > 20 then
    return;
  end if;
  insert into public.login_audit (email, success)
  values (lower(trim(p_email)), p_success);
end;
$$;

revoke all on function public.log_login_attempt(text, boolean) from public;
grant execute on function public.log_login_attempt(text, boolean) to anon, authenticated;

-- ============================================================
-- Migrasi 010 — Kontrak modul integrasi untuk Builder (Fase 0)
-- repo_url: repo GitHub publik berisi file modul (mis. supabase.ts).
-- framework_compat: daftar kode framework yang didukung modul ini
--   (array kosong = semua framework). Dipakai CLI + Builder untuk
--   memfilter opsi yang valid per template base.
-- CARA PAKAI: jalankan blok ini sekali di Supabase SQL Editor.
-- ============================================================
alter table public.integrasi
  add column if not exists repo_url text not null default '',
  add column if not exists framework_compat text[] not null default '{}';