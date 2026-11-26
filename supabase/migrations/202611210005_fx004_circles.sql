-- FX-004.2: private circles and circle invitations.

create table public.circles (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 60),
  created_at timestamptz not null default now()
);

create table public.circle_members (
  circle_id uuid not null references public.circles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (circle_id, user_id)
);

create table public.circle_invites (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.circles(id) on delete cascade,
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invitee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (circle_id, invitee_id),
  check (inviter_id <> invitee_id)
);

create index circle_members_user_idx on public.circle_members (user_id);
create index circle_invites_invitee_idx on public.circle_invites (invitee_id);

create function public.fx_is_circle_member(target_circle uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.circle_members m
    where m.circle_id = target_circle and m.user_id = (select auth.uid())
  );
$$;

create function public.create_circle(p_name text)
returns public.circles
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  new_circle public.circles;
begin
  if me is null then
    raise exception 'Sign in to create a circle.' using errcode = '42501';
  end if;

  insert into public.circles (owner_id, name)
  values (me, btrim(p_name))
  returning * into new_circle;

  insert into public.circle_members (circle_id, user_id)
  values (new_circle.id, me);

  return new_circle;
end;
$$;

create function public.invite_to_circle(p_circle_id uuid, p_friend_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  owner uuid;
begin
  if me is null then
    raise exception 'Sign in to invite a friend.' using errcode = '42501';
  end if;

  select owner_id into owner from public.circles where id = p_circle_id;
  if owner is null then
    raise exception 'Circle not found.' using errcode = 'P0002';
  end if;
  if owner <> me then
    raise exception 'Only the circle owner can invite.' using errcode = '42501';
  end if;
  if p_friend_id = me then
    raise exception 'You are already in this circle.';
  end if;
  if exists (
    select 1 from public.circle_members
    where circle_id = p_circle_id and user_id = p_friend_id
  ) then
    raise exception 'That friend is already in this circle.';
  end if;
  if not exists (
    select 1 from public.friend_requests f
    where f.status = 'accepted'
      and (
        (f.requester_id = me and f.addressee_id = p_friend_id)
        or (f.requester_id = p_friend_id and f.addressee_id = me)
      )
  ) then
    raise exception 'You can only invite an accepted friend.';
  end if;
  if exists (
    select 1 from public.circle_invites
    where circle_id = p_circle_id and invitee_id = p_friend_id
  ) then
    raise exception 'That friend already has an invite for this circle.';
  end if;

  insert into public.circle_invites (circle_id, inviter_id, invitee_id)
  values (p_circle_id, me, p_friend_id);
end;
$$;

create function public.respond_circle_invite(p_invite_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  target_circle uuid;
begin
  if me is null then
    raise exception 'Sign in to answer a circle invite.' using errcode = '42501';
  end if;

  update public.circle_invites
  set status = case when p_accept then 'accepted' else 'declined' end,
      responded_at = now()
  where id = p_invite_id
    and invitee_id = me
    and status = 'pending'
  returning circle_id into target_circle;

  if target_circle is null then
    raise exception 'That invite is not open for you.' using errcode = '42501';
  end if;

  if p_accept then
    insert into public.circle_members (circle_id, user_id)
    values (target_circle, me)
    on conflict do nothing;
  end if;
end;
$$;

create function public.my_circles()
returns table (
  circle_id uuid,
  name text,
  owner_id uuid,
  member_count integer,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    c.id,
    c.name,
    c.owner_id,
    (select count(*)::integer from public.circle_members m2 where m2.circle_id = c.id),
    c.created_at
  from public.circles c
  join public.circle_members m
    on m.circle_id = c.id and m.user_id = (select auth.uid())
  order by c.created_at desc;
$$;

create function public.circle_members_view(p_circle_id uuid)
returns table (user_id uuid, full_name text, username text, joined_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select m.user_id, p.full_name, p.username, m.joined_at
  from public.circle_members m
  join public.profiles p on p.id = m.user_id
  where m.circle_id = p_circle_id
    and public.fx_is_circle_member(p_circle_id)
  order by m.joined_at;
$$;

create function public.my_circle_invites()
returns table (
  invite_id uuid,
  circle_id uuid,
  circle_name text,
  inviter_name text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select i.id, c.id, c.name, p.full_name, i.created_at
  from public.circle_invites i
  join public.circles c on c.id = i.circle_id
  join public.profiles p on p.id = i.inviter_id
  where i.invitee_id = (select auth.uid()) and i.status = 'pending'
  order by i.created_at desc;
$$;

alter table public.circles enable row level security;
alter table public.circle_members enable row level security;
alter table public.circle_invites enable row level security;

revoke all on public.circles, public.circle_members, public.circle_invites
  from public, anon, authenticated;
grant select on public.circles, public.circle_members, public.circle_invites
  to authenticated;

create policy "Members read their circles"
  on public.circles for select to authenticated
  using (public.fx_is_circle_member(id));

create policy "Members read circle members"
  on public.circle_members for select to authenticated
  using (public.fx_is_circle_member(circle_id));

create policy "Inviter or invitee reads invites"
  on public.circle_invites for select to authenticated
  using (
    inviter_id = (select auth.uid())
    or invitee_id = (select auth.uid())
  );

revoke all on function public.fx_is_circle_member(uuid),
  public.create_circle(text),
  public.invite_to_circle(uuid, uuid),
  public.respond_circle_invite(uuid, boolean),
  public.my_circles(),
  public.circle_members_view(uuid),
  public.my_circle_invites()
  from public, anon;

grant execute on function public.fx_is_circle_member(uuid),
  public.create_circle(text),
  public.invite_to_circle(uuid, uuid),
  public.respond_circle_invite(uuid, boolean),
  public.my_circles(),
  public.circle_members_view(uuid),
  public.my_circle_invites()
  to authenticated;
