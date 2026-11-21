create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  full_name text not null check (char_length(btrim(full_name)) between 2 and 80),
  exam_track text not null default 'MDCAT' check (exam_track in ('MDCAT', 'Other')),
  daily_target_minutes integer not null default 180 check (daily_target_minutes between 15 and 720),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on public.profiles from public, anon, authenticated;
grant select on public.profiles to authenticated;
grant insert (id, username, full_name, exam_track, daily_target_minutes) on public.profiles to authenticated;
grant update (username, full_name, exam_track, daily_target_minutes) on public.profiles to authenticated;

create policy "Read own profile"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id);

create policy "Create own profile"
  on public.profiles for insert to authenticated
  with check ((select auth.uid()) = id);

create policy "Update own profile"
  on public.profiles for update to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profile_updated_at before update on public.profiles
for each row execute function public.set_profile_updated_at();

create table public.study_sessions (
  id uuid not null,
  user_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  duration_minutes integer not null check (duration_minutes between 1 and 180),
  finished_at timestamptz not null default now(),
  primary key (user_id, id)
);

create index study_sessions_recent_idx
  on public.study_sessions (user_id, finished_at desc);

alter table public.study_sessions enable row level security;
revoke all on public.study_sessions from public, anon, authenticated;
grant select on public.study_sessions to authenticated;
grant insert (id, duration_minutes) on public.study_sessions to authenticated;

create policy "Read own sessions"
  on public.study_sessions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Record own sessions"
  on public.study_sessions for insert to authenticated
  with check ((select auth.uid()) = user_id);

create function public.study_summary()
returns table (today_minutes integer, total_minutes integer)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    coalesce(sum(s.duration_minutes) filter (
      where s.finished_at >= date_trunc('day', now(), 'Asia/Karachi')
    ), 0)::integer,
    coalesce(sum(s.duration_minutes), 0)::integer
  from public.study_sessions as s
  where s.user_id = (select auth.uid());
$$;

revoke all on function public.study_summary() from public, anon, authenticated;
grant execute on function public.study_summary() to authenticated;
