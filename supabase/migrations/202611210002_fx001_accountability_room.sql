-- FX-001: private two-person accountability room.
-- Room, frozen round roster, self-owned outcomes and one peer response per member.

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null default auth.uid() references public.profiles(id) on delete cascade,
  subject text not null check (char_length(btrim(subject)) between 2 and 80),
  duration_minutes integer not null check (duration_minutes between 1 and 180),
  join_code text not null unique default substr(replace(gen_random_uuid()::text, '-', ''), 1, 10),
  current_round integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal text check (goal is null or char_length(btrim(goal)) between 3 and 200),
  is_ready boolean not null default false,
  joined_at timestamptz not null default now(),
  primary key (room_id, user_id),
  constraint room_member_ready_needs_goal check (not is_ready or goal is not null)
);

create table public.rounds (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  number integer not null check (number > 0),
  started_at timestamptz not null default now(),
  deadline timestamptz not null,
  checkin_deadline timestamptz not null,
  unique (room_id, number),
  check (deadline > started_at),
  check (checkin_deadline >= deadline)
);

create table public.round_members (
  round_id uuid not null references public.rounds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  goal text not null,
  left_at timestamptz,
  primary key (round_id, user_id)
);

create table public.round_outcomes (
  round_id uuid not null references public.rounds(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('completed', 'partly', 'missed')),
  note text check (note is null or char_length(note) <= 280),
  updated_at timestamptz not null default now(),
  primary key (round_id, user_id)
);

create table public.round_responses (
  id uuid primary key default gen_random_uuid(),
  round_id uuid not null references public.rounds(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  target_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('acknowledged', 'no_check_in')),
  note text check (note is null or char_length(note) <= 280),
  created_at timestamptz not null default now(),
  unique (round_id, author_id),
  unique (round_id, target_id),
  check (author_id <> target_id)
);

-- Membership checks used by row policies. Security definer avoids policy recursion.
create function public.fx_is_room_member(target_room uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.room_members m
    where m.room_id = target_room and m.user_id = (select auth.uid())
  );
$$;

create function public.fx_is_round_member(target_round uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.round_members rm
    where rm.round_id = target_round and rm.user_id = (select auth.uid())
  );
$$;

create function public.fx_round_checkin_open(target_round uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.rounds r
    where r.id = target_round
      and now() >= r.deadline
      and now() < r.checkin_deadline
  );
$$;

create function public.fx_room_has_live_round(target_room uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.rounds r
    where r.room_id = target_room and now() < r.deadline
  );
$$;

-- Room creation and joining run through these functions so membership cannot be forged.

create function public.create_room(p_subject text, p_duration_minutes integer)
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

  insert into public.rooms (host_id, subject, duration_minutes)
  values (me, btrim(p_subject), p_duration_minutes)
  returning * into new_room;

  insert into public.room_members (room_id, user_id) values (new_room.id, me);
  return new_room;
end;
$$;

create function public.join_room_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  target uuid;
begin
  if me is null then
    raise exception 'Sign in to join a room.' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = me) then
    raise exception 'Your account has no profile. Sign out and sign in again.' using errcode = '42501';
  end if;

  select id into target from public.rooms where join_code = lower(btrim(p_code));
  if target is null then
    raise exception 'That room code does not match a room.' using errcode = 'P0002';
  end if;

  insert into public.room_members (room_id, user_id) values (target, me)
  on conflict (room_id, user_id) do nothing;

  return target;
end;
$$;

create function public.room_preview(p_code text)
returns table (
  room_id uuid,
  subject text,
  duration_minutes integer,
  host_name text,
  member_count integer,
  is_member boolean
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
    )
  from public.rooms r
  join public.profiles p on p.id = r.host_id
  where r.join_code = lower(btrim(p_code));
$$;

create function public.room_member_directory(target_room uuid)
returns table (user_id uuid, full_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.full_name
  from public.room_members m
  join public.profiles p on p.id = m.user_id
  where m.room_id = target_room and public.fx_is_room_member(target_room);
$$;

-- One start per room round. Freeze ready goals and set one server deadline.
create function public.start_round(p_room_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  room_row public.rooms;
  next_number integer;
  new_round uuid;
begin
  select * into room_row from public.rooms where id = p_room_id;
  if room_row.id is null then
    raise exception 'Room not found.' using errcode = 'P0002';
  end if;
  if room_row.host_id <> me then
    raise exception 'Only the host can start the round.' using errcode = '42501';
  end if;
  if public.fx_room_has_live_round(p_room_id) then
    raise exception 'This round is still running.';
  end if;
  if (select count(*) from public.room_members where room_id = p_room_id and is_ready and goal is not null) < 2 then
    raise exception 'Two members need a goal and ready state before the round starts.';
  end if;

  select coalesce(max(number), 0) + 1 into next_number
  from public.rounds where room_id = p_room_id;

  insert into public.rounds (room_id, number, started_at, deadline, checkin_deadline)
  values (
    p_room_id,
    next_number,
    now(),
    now() + make_interval(mins => room_row.duration_minutes),
    now() + make_interval(mins => room_row.duration_minutes) + interval '24 hours'
  )
  returning id into new_round;

  insert into public.round_members (round_id, user_id, goal)
  select new_round, m.user_id, m.goal
  from public.room_members m
  where m.room_id = p_room_id and m.is_ready and m.goal is not null;

  update public.room_members set is_ready = false where room_id = p_room_id;
  update public.rooms set current_round = next_number where id = p_room_id;

  return new_round;
end;
$$;

create function public.leave_round(p_round_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if not public.fx_is_round_member(p_round_id) then
    raise exception 'You are not part of this round.' using errcode = '42501';
  end if;

  update public.round_members
  set left_at = coalesce(left_at, now())
  where round_id = p_round_id and user_id = me;
end;
$$;

create function public.submit_outcome(p_round_id uuid, p_status text, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if not public.fx_is_round_member(p_round_id) then
    raise exception 'You are not part of this round.' using errcode = '42501';
  end if;
  if p_status not in ('completed', 'partly', 'missed') then
    raise exception 'Choose completed, partly completed or missed.';
  end if;
  if not public.fx_round_checkin_open(p_round_id) then
    raise exception 'Check-in opens when the round ends and closes 24 hours later.';
  end if;

  insert into public.round_outcomes (round_id, user_id, status, note, updated_at)
  values (p_round_id, me, p_status, nullif(btrim(coalesce(p_note, '')), ''), now())
  on conflict (round_id, user_id) do update
    set status = excluded.status, note = excluded.note, updated_at = now();
end;
$$;

create function public.fx_peer_for(target_round uuid, member uuid)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  with roster as (
    select array_agg(user_id order by user_id) as ids
    from public.round_members
    where round_id = target_round
  )
  select ids[(array_position(ids, member) % array_length(ids, 1)) + 1]
  from roster
  where array_length(ids, 1) > 1
    and array_position(ids, member) is not null;
$$;

create function public.respond_to_peer(p_round_id uuid, p_target_id uuid, p_kind text, p_note text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if not public.fx_is_round_member(p_round_id)
     or not exists (select 1 from public.round_members where round_id = p_round_id and user_id = p_target_id) then
    raise exception 'Only members of this round can respond.' using errcode = '42501';
  end if;
  if me = p_target_id then
    raise exception 'Respond to a peer, not yourself.';
  end if;
  if p_target_id <> public.fx_peer_for(p_round_id, me) then
    raise exception 'Respond to your assigned peer for this round.' using errcode = '42501';
  end if;
  if p_kind = 'acknowledged' then
    if not exists (select 1 from public.round_outcomes where round_id = p_round_id and user_id = p_target_id) then
      raise exception 'Wait for your peer to check in before acknowledging.';
    end if;
  elsif p_kind = 'no_check_in' then
    if exists (select 1 from public.round_outcomes where round_id = p_round_id and user_id = p_target_id) then
      raise exception 'Your peer checked in. Acknowledge their result instead.';
    end if;
    if not exists (select 1 from public.rounds where id = p_round_id and now() >= checkin_deadline) then
      raise exception 'You can record no check-in after the check-in window closes.';
    end if;
  else
    raise exception 'Choose a valid response.';
  end if;

  insert into public.round_responses (round_id, author_id, target_id, kind, note)
  values (p_round_id, me, p_target_id, p_kind, nullif(btrim(coalesce(p_note, '')), ''))
  on conflict do nothing;
end;
$$;

revoke all on public.rooms, public.room_members, public.rounds, public.round_members,
  public.round_outcomes, public.round_responses from public, anon, authenticated;

grant select on public.rooms, public.room_members, public.rounds, public.round_members,
  public.round_outcomes, public.round_responses to authenticated;
grant update (goal, is_ready) on public.room_members to authenticated;

revoke all on function public.fx_is_room_member(uuid), public.fx_is_round_member(uuid),
  public.fx_round_checkin_open(uuid), public.fx_room_has_live_round(uuid),
  public.fx_peer_for(uuid, uuid) from public, anon;
grant execute on function public.fx_is_room_member(uuid), public.fx_is_round_member(uuid),
  public.fx_round_checkin_open(uuid), public.fx_room_has_live_round(uuid) to authenticated;

revoke all on function public.create_room(text, integer), public.join_room_by_code(text),
  public.room_preview(text), public.room_member_directory(uuid), public.start_round(uuid),
  public.leave_round(uuid), public.submit_outcome(uuid, text, text),
  public.respond_to_peer(uuid, uuid, text, text) from public, anon;
grant execute on function public.create_room(text, integer), public.join_room_by_code(text),
  public.room_member_directory(uuid), public.start_round(uuid), public.leave_round(uuid),
  public.submit_outcome(uuid, text, text), public.respond_to_peer(uuid, uuid, text, text) to authenticated;
grant execute on function public.room_preview(text) to anon, authenticated;

alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.rounds enable row level security;
alter table public.round_members enable row level security;
alter table public.round_outcomes enable row level security;
alter table public.round_responses enable row level security;

create policy "Members read their room"
  on public.rooms for select to authenticated
  using (public.fx_is_room_member(id));

create policy "Members read room members"
  on public.room_members for select to authenticated
  using (public.fx_is_room_member(room_id));

create policy "Members set their own goal and ready state"
  on public.room_members for update to authenticated
  using (user_id = (select auth.uid()) and not public.fx_room_has_live_round(room_id))
  with check (user_id = (select auth.uid()));

create policy "Members read rounds"
  on public.rounds for select to authenticated
  using (public.fx_is_room_member(room_id));

create policy "Members read round rosters"
  on public.round_members for select to authenticated
  using (public.fx_is_round_member(round_id));

create policy "Members read outcomes"
  on public.round_outcomes for select to authenticated
  using (public.fx_is_round_member(round_id));

create policy "Members read peer responses"
  on public.round_responses for select to authenticated
  using (public.fx_is_round_member(round_id));

-- New accounts get their profile from sign-up metadata, so a failed username does not
-- leave a session without a profile.
create function public.fx_create_profile_for_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, username, exam_track, daily_target_minutes)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'Student'),
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'username'), ''), 'user_' || substr(new.id::text, 1, 8)),
    coalesce(nullif(new.raw_user_meta_data ->> 'exam_track', ''), 'MDCAT'),
    coalesce((new.raw_user_meta_data ->> 'daily_target_minutes')::integer, 180)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger fx_profile_for_new_user
  after insert on auth.users
  for each row execute function public.fx_create_profile_for_new_user();
