-- FX-004.4: expiring and revocable room invites.

alter table public.rooms
  add column join_code_expires_at timestamptz not null
    default (now() + interval '7 days');

create or replace function public.join_room_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  target uuid;
  expires timestamptz;
begin
  if me is null then
    raise exception 'Sign in to join a room.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = me) then
    raise exception 'Your account has no profile. Sign out and sign in again.' using errcode = '42501';
  end if;

  select id, join_code_expires_at into target, expires
  from public.rooms
  where join_code = lower(btrim(p_code));

  if target is null then
    raise exception 'That room code does not match a room.' using errcode = 'P0002';
  end if;
  if expires <= now() then
    raise exception 'This invite link has expired. Ask the host for a new one.' using errcode = 'P0002';
  end if;

  insert into public.room_members (room_id, user_id) values (target, me)
  on conflict (room_id, user_id) do nothing;

  return target;
end;
$$;

drop function if exists public.room_preview(text);

create function public.room_preview(p_code text)
returns table (
  room_id uuid,
  subject text,
  duration_minutes integer,
  host_name text,
  member_count integer,
  is_member boolean,
  challenge text,
  expires_at timestamptz
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
    r.challenge,
    r.join_code_expires_at
  from public.rooms r
  join public.profiles p on p.id = r.host_id
  where r.join_code = lower(btrim(p_code));
$$;

revoke all on function public.room_preview(text) from public, anon;
grant execute on function public.room_preview(text) to anon, authenticated;

create function public.refresh_room_invite(p_room_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  room_row public.rooms;
  new_code text;
begin
  if me is null then
    raise exception 'Sign in to create an invite.' using errcode = '42501';
  end if;

  select * into room_row from public.rooms where id = p_room_id;
  if room_row.id is null then
    raise exception 'Room not found.' using errcode = 'P0002';
  end if;
  if room_row.host_id <> me then
    raise exception 'Only the host can create a new invite.' using errcode = '42501';
  end if;

  new_code := substr(replace(gen_random_uuid()::text, '-', ''), 1, 10);

  update public.rooms
  set join_code = new_code,
      join_code_expires_at = now() + interval '7 days'
  where id = p_room_id;

  return new_code;
end;
$$;

revoke all on function public.refresh_room_invite(uuid) from public, anon;
grant execute on function public.refresh_room_invite(uuid) to authenticated;
