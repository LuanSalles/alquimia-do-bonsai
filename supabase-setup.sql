-- Alquimia do Bonsai - catalogo real com admin seguro
-- Cole este arquivo no Supabase em SQL Editor > New query > Run.

create extension if not exists pgcrypto;

create table if not exists public.admin_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role text not null default 'admin' check (role = 'admin'),
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_items (
  id uuid primary key default gen_random_uuid(),
  active boolean not null default true,
  category text not null default 'bonsai' check (category in ('bonsai','prebonsai','produto')),
  name_pt text not null,
  name_en text,
  species_pt text,
  species_en text,
  description_pt text,
  description_en text,
  care_pt text,
  care_en text,
  price_brl numeric(10,2) not null default 0,
  stock integer not null default 1,
  height_pt text,
  height_en text,
  age_pt text,
  age_en text,
  style_pt text,
  style_en text,
  pot_pt text,
  pot_en text,
  image_url text,
  whatsapp_pt text,
  whatsapp_en text,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists catalog_items_touch_updated_at on public.catalog_items;
create trigger catalog_items_touch_updated_at
before update on public.catalog_items
for each row execute function public.touch_updated_at();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_profiles ap
    where ap.user_id = auth.uid()
      and ap.role = 'admin'
  );
$$;

alter table public.admin_profiles enable row level security;
alter table public.catalog_items enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.catalog_items to anon, authenticated;
grant insert, update, delete on public.catalog_items to authenticated;
grant select on public.admin_profiles to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "admin profiles read own admin status" on public.admin_profiles;
create policy "admin profiles read own admin status"
on public.admin_profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "catalog public read active" on public.catalog_items;
create policy "catalog public read active"
on public.catalog_items
for select
to anon, authenticated
using (active = true or public.is_admin());

drop policy if exists "catalog admin insert" on public.catalog_items;
create policy "catalog admin insert"
on public.catalog_items
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "catalog admin update" on public.catalog_items;
create policy "catalog admin update"
on public.catalog_items
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "catalog admin delete" on public.catalog_items;
create policy "catalog admin delete"
on public.catalog_items
for delete
to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-images',
  'catalog-images',
  true,
  10485760,
  array['image/jpeg','image/png','image/webp','image/gif']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "catalog images public read" on storage.objects;
create policy "catalog images public read"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'catalog-images');

drop policy if exists "catalog images admin insert" on storage.objects;
create policy "catalog images admin insert"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'catalog-images' and public.is_admin());

drop policy if exists "catalog images admin update" on storage.objects;
create policy "catalog images admin update"
on storage.objects
for update
to authenticated
using (bucket_id = 'catalog-images' and public.is_admin())
with check (bucket_id = 'catalog-images' and public.is_admin());

drop policy if exists "catalog images admin delete" on storage.objects;
create policy "catalog images admin delete"
on storage.objects
for delete
to authenticated
using (bucket_id = 'catalog-images' and public.is_admin());

-- Depois de criar o usuario da sua mae em Authentication > Users,
-- rode este comando trocando o e-mail:
--
-- insert into public.admin_profiles (user_id, email, role)
-- select id, email, 'admin'
-- from auth.users
-- where email = 'EMAIL_DA_SUA_MAE_AQUI'
-- on conflict (user_id) do update set email = excluded.email, role = 'admin';
