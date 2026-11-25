-- FX-004.1: friend requests and accepted friends.

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  unique (requester_id, addressee_id),
  check (requester_id <> addressee_id)
);

create index friend_requests_addressee_idx
  on public.friend_requests (addressee_id);

alter table public.friend_requests enable row level security;
revoke all on public.friend_requests from public, anon, authenticated;
grant select on public.friend_requests to authenticated;

create policy "Read own friend requests"
  on public.friend_requests for select to authenticated
  using (
    requester_id = (select auth.uid())
    or addressee_id = (select auth.uid())
  );

create function public.send_friend_request(p_username text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
  target uuid;
begin
  if me is null then
    raise exception 'Sign in to add a friend.' using errcode = '42501';
  end if;

  select id into target
  from public.profiles
  where username = lower(btrim(p_username));

  if target is null then
    raise exception 'No account uses that username.' using errcode = 'P0002';
  end if;
  if target = me then
    raise exception 'You cannot add yourself.';
  end if;
  if exists (
    select 1 from public.friend_requests
    where (requester_id = me and addressee_id = target)
       or (requester_id = target and addressee_id = me)
  ) then
    raise exception 'A friend request already exists between these accounts.';
  end if;

  insert into public.friend_requests (requester_id, addressee_id)
  values (me, target);
end;
$$;

create function public.respond_friend_request(p_request_id uuid, p_accept boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := (select auth.uid());
begin
  if me is null then
    raise exception 'Sign in to answer a request.' using errcode = '42501';
  end if;

  update public.friend_requests
  set status = case when p_accept then 'accepted' else 'declined' end,
      responded_at = now()
  where id = p_request_id
    and addressee_id = me
    and status = 'pending';

  if not found then
    raise exception 'That request is not open for you.' using errcode = '42501';
  end if;
end;
$$;

create function public.my_friends()
returns table (
  request_id uuid,
  user_id uuid,
  full_name text,
  username text,
  direction text,
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    f.id,
    p.id,
    p.full_name,
    p.username,
    case
      when f.requester_id = (select auth.uid()) then 'outgoing'
      else 'incoming'
    end,
    f.status,
    f.created_at
  from public.friend_requests f
  join public.profiles p on p.id = case
    when f.requester_id = (select auth.uid()) then f.addressee_id
    else f.requester_id
  end
  where f.requester_id = (select auth.uid())
     or f.addressee_id = (select auth.uid())
  order by f.created_at desc;
$$;

revoke all on function public.send_friend_request(text),
  public.respond_friend_request(uuid, boolean),
  public.my_friends() from public, anon;

grant execute on function public.send_friend_request(text),
  public.respond_friend_request(uuid, boolean),
  public.my_friends() to authenticated;
