-- FX-003.2: exam year and reporting timezone on the profile.

alter table public.profiles
  add column exam_year integer not null
    default date_part('year', now())::integer
    check (exam_year between 2020 and 2045),
  add column timezone text not null default 'Asia/Karachi'
    check (btrim(timezone) <> '');

grant update (exam_year, timezone) on public.profiles to authenticated;

-- New accounts get both fields from their sign-up metadata.
create or replace function public.fx_create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (
    id,
    full_name,
    username,
    exam_track,
    daily_target_minutes,
    exam_year,
    timezone
  )
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'Student'),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'username'), ''), 'user_' || substr(new.id::text, 1, 8)),
    coalesce(nullif(new.raw_user_meta_data ->> 'exam_track', ''), 'MDCAT'),
    coalesce((new.raw_user_meta_data ->> 'daily_target_minutes')::integer, 180),
    coalesce((new.raw_user_meta_data ->> 'exam_year')::integer, date_part('year', now())::integer),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'timezone'), ''), 'Asia/Karachi')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
