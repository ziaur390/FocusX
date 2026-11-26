-- FX-004.3: an optional shared challenge on a room.

alter table public.rooms
  add column challenge text
    check (challenge is null or char_length(btrim(challenge)) between 3 and 200);

drop function if exists public.create_room(text, integer);

create function public.create_room(
  p_subject text,
  p_duration_minutes integer,
  p_challenge text default null
)
returns public.rooms
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  new_room public.rooms;
begin
  if me is null then
    raise exception 'Sign in to create a room.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = me) then
    raise exception 'Your account has no profile. Sign out and sign in again.' using errcode = '42501';
  end if;

  insert into public.rooms (host_id, subject, duration_minutes, challenge)
  values (
    me,
    btrim(p_subject),
    p_duration_minutes,
    nullif(btrim(coalesce(p_challenge, '')), '')
  )
  returning * into new_room;

  insert into public.room_members (room_id, user_id) values (new_room.id, me);
  return new_room;
end;
$$;

revoke all on function public.create_room(text, integer, text) from public, anon;
grant execute on function public.create_room(text, integer, text) to authenticated;

drop function if exists public.room_preview(text);

create function public.room_preview(p_code text)
returns table (
  room_id uuid,
  subject text,
  duration_minutes integer,
  host_name text,
  member_count integer,
  is_member boolean,
  challenge text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id,
    r.subject,
    r.duration_minutes,
    p.full_name,
    (select count(*)::integer from public.room_members m where m.room_id = r.id),
    exists (
      select 1 from public.room_members m
      where m.room_id = r.id and m.user_id = (select auth.uid())
    ),
    r.challenge
  from public.rooms r
  join public.profiles p on p.id = r.host_id
  where r.join_code = lower(btrim(p_code));
$$;

revoke all on function public.room_preview(text) from public, anon;
grant execute on function public.room_preview(text) to anon, authenticated;
