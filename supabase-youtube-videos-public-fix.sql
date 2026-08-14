-- Fix public YouTube videos visibility for Alquimia do Bonsai.
-- Run this in Supabase > SQL Editor.

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

grant select on public.youtube_videos to anon;
grant select, insert, update, delete on public.youtube_videos to authenticated;

-- Existing videos should be visible because the admin screen does not have
-- a public/private toggle yet.
update public.youtube_videos
set active = true
where active is distinct from true;

drop policy if exists "Public can read active youtube videos" on public.youtube_videos;
drop policy if exists "Public can read youtube videos" on public.youtube_videos;
drop policy if exists "Admins can insert youtube videos" on public.youtube_videos;
drop policy if exists "Admins can update youtube videos" on public.youtube_videos;
drop policy if exists "Admins can delete youtube videos" on public.youtube_videos;

-- Public site can read the video list.
create policy "Public can read youtube videos"
on public.youtube_videos
for select
to anon, authenticated
using (true);

-- Only logged-in admins can manage videos.
create policy "Admins can insert youtube videos"
on public.youtube_videos
for insert
to authenticated
with check (public.is_admin());

create policy "Admins can update youtube videos"
on public.youtube_videos
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can delete youtube videos"
on public.youtube_videos
for delete
to authenticated
using (public.is_admin());
