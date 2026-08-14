-- Correção isolada para a área de vídeos do YouTube.
-- Rode este arquivo no SQL Editor do Supabase se o admin mostrar
-- "Erro ao salvar vídeo: ..." ao cadastrar ou editar vídeos.

create table if not exists public.youtube_videos (
  id uuid primary key default gen_random_uuid(),
  active boolean not null default true,
  locale text not null default 'pt' check (locale in ('pt','en','both')),
  title_pt text not null,
  title_en text,
  description_pt text,
  description_en text,
  youtube_url text not null,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.youtube_videos enable row level security;

grant select on public.youtube_videos to anon, authenticated;
grant insert, update, delete on public.youtube_videos to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

drop policy if exists "youtube public read active" on public.youtube_videos;
create policy "youtube public read active"
on public.youtube_videos
for select
to anon, authenticated
using (active = true or public.is_admin());

drop policy if exists "youtube admin insert" on public.youtube_videos;
create policy "youtube admin insert"
on public.youtube_videos
for insert
to authenticated
with check (public.is_admin());

drop policy if exists "youtube admin update" on public.youtube_videos;
create policy "youtube admin update"
on public.youtube_videos
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "youtube admin delete" on public.youtube_videos;
create policy "youtube admin delete"
on public.youtube_videos
for delete
to authenticated
using (public.is_admin());
