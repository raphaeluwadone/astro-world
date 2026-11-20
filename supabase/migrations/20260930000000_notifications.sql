-- In-app notifications (read state changes only through mark_notifications_read), opt-in email preferences and an email outbox drained by the send-emails edge function.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Server-side settings the client never reads.
create table public.app_config (
  key text primary key,
  value text not null
);
alter table public.app_config enable row level security;

-- Local default. In production set it to https://<project-ref>.supabase.co/functions/v1/send-emails.
insert into public.app_config (key, value) values
  ('send_emails_url', 'http://supabase_kong_astro:8000/functions/v1/send-emails'),
  ('notifications_since', now()::text);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  data jsonb not null default '{}',
  link text,
  actor_id uuid references public.players(id) on delete set null,
  dedupe_key text unique,
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;
create policy notifications_select_own on public.notifications
  for select to authenticated using (user_id = auth.uid());
alter publication supabase_realtime add table public.notifications;

-- Opt-in emails start off. Account and roster-claim emails are always sent.
create table public.notification_prefs (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email_badges boolean not null default false,
  email_dues boolean not null default false,
  email_matchday boolean not null default false,
  updated_at timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;
create policy notification_prefs_select_own on public.notification_prefs
  for select to authenticated using (user_id = auth.uid());
create policy notification_prefs_insert_own on public.notification_prefs
  for insert to authenticated with check (user_id = auth.uid());
create policy notification_prefs_update_own on public.notification_prefs
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create trigger notification_prefs_set_updated_at
  before update on public.notification_prefs
  for each row execute function public.set_updated_at();

create table public.email_outbox (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  to_email text not null,
  template text not null,
  data jsonb not null default '{}',
  created_at timestamptz not null default now(),
  attempts int not null default 0,
  locked_at timestamptz,
  sent_at timestamptz,
  last_error text
);
create index email_outbox_unsent_idx on public.email_outbox (created_at) where sent_at is null;
alter table public.email_outbox enable row level security;

-- ---------------------------------------------------------------------------
-- Core
-- ---------------------------------------------------------------------------

-- p_email_pref names a notification_prefs column; null means the email is always sent.
create or replace function public.notify(
  p_user uuid,
  p_kind text,
  p_data jsonb,
  p_link text,
  p_actor uuid default null,
  p_dedupe text default null,
  p_email text default null,
  p_email_pref text default null
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted uuid;
  wants boolean;
  address text;
begin
  if p_user is null then
    return false;
  end if;

  insert into notifications (user_id, kind, data, link, actor_id, dedupe_key)
  values (p_user, p_kind, coalesce(p_data, '{}'), p_link, p_actor, p_dedupe)
  on conflict (dedupe_key) do nothing
  returning id into inserted;

  if inserted is null or p_email is null then
    return inserted is not null;
  end if;

  if p_email_pref is null then
    wants := true;
  else
    execute format('select %I from notification_prefs where user_id = $1', p_email_pref) into wants using p_user;
  end if;

  if coalesce(wants, false) then
    select email into address from auth.users where id = p_user;
    if address is not null then
      insert into email_outbox (user_id, to_email, template, data)
      values (p_user, address, p_email, coalesce(p_data, '{}') || jsonb_build_object('link', p_link));
    end if;
  end if;
  return true;
end;
$$;
revoke all on function public.notify(uuid, text, jsonb, text, uuid, text, text, text) from public, anon, authenticated;

create or replace function public.player_user(p_player uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select user_id from players where id = p_player;
$$;

create or replace function public.requesting_player_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id from players where user_id = auth.uid();
$$;

create or replace function public.notifications_since()
returns timestamptz
language sql
stable
security definer
set search_path = public
as $$
  select value::timestamptz from app_config where key = 'notifications_since';
$$;

create or replace function public.mark_notifications_read(p_ids uuid[] default null)
returns void
language sql
security definer
set search_path = public
as $$
  update notifications set read_at = now()
  where user_id = auth.uid() and read_at is null and (p_ids is null or id = any(p_ids));
$$;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

-- ---------------------------------------------------------------------------
-- Matchday
-- ---------------------------------------------------------------------------

create or replace function public.notify_weekly_claim()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  md matchdays;
  monthly int;
  spot int;
begin
  select * into md from matchdays where id = new.matchday_id;
  select count(*) into monthly from monthly_memberships where month = date_trunc('month', md.played_at)::date;
  select count(*) into spot from weekly_claims where matchday_id = new.matchday_id and claimed_at <= new.claimed_at;
  perform notify(
    player_user(new.player_id), 'spot',
    jsonb_build_object('matchday_id', md.id, 'played_at', md.played_at, 'spot', least(monthly + spot, md.capacity), 'capacity', md.capacity),
    '/matchday', null, 'spot:' || new.id, 'spot', 'email_matchday'
  );
  return null;
end;
$$;
create trigger weekly_claims_notify after insert on public.weekly_claims
  for each row execute function public.notify_weekly_claim();

create or replace function public.notify_standby_join()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  md matchdays;
  pos int;
begin
  select * into md from matchdays where id = new.matchday_id;
  select count(*) into pos from matchday_standby_entries where matchday_id = new.matchday_id and created_at <= new.created_at;
  perform notify(
    player_user(new.player_id), 'standby',
    jsonb_build_object('matchday_id', md.id, 'played_at', md.played_at, 'position', pos),
    '/matchday', null, 'standby:' || new.matchday_id || ':' || new.player_id || ':' || extract(epoch from new.created_at)
  );
  return null;
end;
$$;
create trigger standby_notify after insert on public.matchday_standby_entries
  for each row execute function public.notify_standby_join();

-- A spot freed up: tell everyone on standby, first to claim gets it.
create or replace function public.notify_spot_opened(p_matchday uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  md matchdays;
  s record;
begin
  select * into md from matchdays where id = p_matchday;
  if md.status <> 'open' then
    return;
  end if;
  for s in select player_id from matchday_standby_entries where matchday_id = p_matchday loop
    perform notify(
      player_user(s.player_id), 'spot_open',
      jsonb_build_object('matchday_id', md.id, 'played_at', md.played_at),
      '/matchday', null, 'spot-open:' || p_reason || ':' || s.player_id
    );
  end loop;
end;
$$;

create or replace function public.notify_claim_withdrawn()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform notify_spot_opened(old.matchday_id, old.id::text);
  return null;
end;
$$;
create trigger weekly_claims_withdrawn_notify after delete on public.weekly_claims
  for each row execute function public.notify_claim_withdrawn();

create or replace function public.notify_monthly_opt_out()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'out' and (tg_op = 'INSERT' or old.status is distinct from 'out')
     and player_is_monthly_member_for(new.player_id, new.matchday_id) then
    perform notify_spot_opened(new.matchday_id, 'out:' || new.player_id || ':' || extract(epoch from now()));
  end if;
  return null;
end;
$$;
create trigger availability_opt_out_notify after insert or update of status on public.availability
  for each row execute function public.notify_monthly_opt_out();

create or replace function public.notify_matchday_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  m record;
begin
  if new.status = 'drawn' and old.status is distinct from 'drawn' then
    for m in
      select tm.player_id, t.id as team_id, t.greek_name, t.colour
      from teams t join team_members tm on tm.team_id = t.id
      where t.matchday_id = new.id
    loop
      perform notify(
        player_user(m.player_id), 'teams_drawn',
        jsonb_build_object('matchday_id', new.id, 'played_at', new.played_at, 'team', m.greek_name, 'colour', m.colour),
        '/matchday', null, 'teams:' || m.team_id || ':' || m.player_id
      );
    end loop;
  end if;

  if new.status = 'played' and old.status is distinct from 'played' then
    for m in
      select distinct tm.player_id
      from teams t join team_members tm on tm.team_id = t.id
      where t.matchday_id = new.id
    loop
      perform notify(
        player_user(m.player_id), 'rate',
        jsonb_build_object('matchday_id', new.id, 'played_at', new.played_at),
        '/matchday/voting', null, 'rate:' || new.id || ':' || m.player_id
      );
    end loop;
  end if;
  return null;
end;
$$;
create trigger matchdays_status_notify after update of status on public.matchdays
  for each row execute function public.notify_matchday_status();

-- ---------------------------------------------------------------------------
-- Badges
-- ---------------------------------------------------------------------------

create or replace function public.notify_badge_won(b player_badges)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  shared text[];
begin
  select array_agg(p.nickname order by p.nickname) into shared
  from player_badges o join players p on p.id = o.player_id
  where o.badge_key = b.badge_key and o.period_key is not distinct from b.period_key
    and o.id <> b.id and badge_is_visible(o.status, o.auto_live_at);

  perform notify(
    player_user(b.player_id), 'badge_won',
    jsonb_build_object(
      'badge_id', b.id, 'badge_key', b.badge_key, 'period_key', b.period_key, 'stat', b.stat,
      'detail', b.detail, 'awarded_at', b.awarded_at, 'expires_at', b.expires_at,
      'shared_with', coalesce(to_jsonb(shared), '[]'::jsonb)
    ),
    '/awards/' || b.badge_key, null, 'badge-won:' || b.id, 'badge', 'email_badges'
  );
end;
$$;

create or replace function public.notify_badge_confirmed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'live' and old.status is distinct from 'live' and new.expires_at > now() then
    perform notify_badge_won(new);
  end if;
  return null;
end;
$$;
create trigger player_badges_confirmed_notify after update of status on public.player_badges
  for each row execute function public.notify_badge_confirmed();

-- ---------------------------------------------------------------------------
-- Social
-- ---------------------------------------------------------------------------

create or replace function public.notify_mention()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p posts;
begin
  select * into p from posts where id = new.post_id;
  if p.author_id = new.mentioned_player_id then
    return null;
  end if;
  perform notify(
    player_user(new.mentioned_player_id), 'mention',
    jsonb_build_object('post_id', p.id, 'excerpt', left(p.content, 140)),
    '/community?post=' || p.id, p.author_id, 'mention:' || p.id || ':' || new.mentioned_player_id
  );
  return null;
end;
$$;
create trigger post_mentions_notify after insert on public.post_mentions
  for each row execute function public.notify_mention();

-- The author and anyone @mentioned in the write-up hear about reactions, once per reactor.
create or replace function public.notify_honours_reaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  h honours_posts;
  r record;
begin
  select * into h from honours_posts where id = new.post_id;
  for r in
    select id from players
    where id <> new.player_id
      and (id = h.author_id or h.content ilike '%@' || nickname || '%')
  loop
    perform notify(
      player_user(r.id), 'honours_reaction',
      jsonb_build_object('post_id', h.id, 'title', h.title, 'emoji', new.emoji),
      '/honours', new.player_id, 'honours:' || h.id || ':' || new.player_id || ':' || r.id
    );
  end loop;
  return null;
end;
$$;
create trigger honours_reactions_notify after insert on public.honours_reactions
  for each row execute function public.notify_honours_reaction();

-- ---------------------------------------------------------------------------
-- Account
-- ---------------------------------------------------------------------------

create or replace function public.notify_claim_decided()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  pl players;
begin
  if new.status = old.status or new.status = 'pending' then
    return null;
  end if;
  select * into pl from players where id = new.player_id;
  perform notify(
    new.claimant_user_id, 'claim_' || new.status,
    jsonb_build_object(
      'player_id', pl.id, 'nickname', pl.nickname,
      'legacy_goals', pl.legacy_goals, 'legacy_assists', pl.legacy_assists
    ),
    case when new.status = 'approved' then '/profile' else '/join' end,
    requesting_player_id(), 'claim:' || new.id || ':' || new.status,
    case when new.status = 'approved' then 'claim-approved' end
  );
  return null;
end;
$$;
create trigger player_claims_decided_notify after update of status on public.player_claims
  for each row execute function public.notify_claim_decided();

create or replace function public.notify_dues_paid()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  q dues_quarters;
  marker text;
begin
  select * into q from dues_quarters where id = new.dues_quarter_id;
  select nickname into marker from players where id = new.marked_by;
  perform notify(
    player_user(new.player_id), 'dues_paid',
    jsonb_build_object('quarter_id', q.id, 'year', q.year, 'quarter', q.quarter, 'amount', q.amount, 'paid_at', new.paid_at, 'marked_by', marker),
    '/kitty', new.marked_by, 'dues-paid:' || new.id, 'dues-paid', 'email_dues'
  );
  return null;
end;
$$;
create trigger dues_payments_notify after insert on public.dues_payments
  for each row execute function public.notify_dues_paid();

create or replace function public.notify_photo_by_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.photo_url is not distinct from old.photo_url or auth.uid() is null or new.user_id = auth.uid() then
    return null;
  end if;
  perform notify(
    new.user_id, 'photo_changed',
    jsonb_build_object('action', case when new.photo_url is null then 'removed' when old.photo_url is null then 'added' else 'changed' end),
    '/profile/edit', requesting_player_id()
  );
  return null;
end;
$$;
create trigger players_photo_admin_notify after update of photo_url on public.players
  for each row execute function public.notify_photo_by_admin();

-- ---------------------------------------------------------------------------
-- Sweep: time-based events (auto-confirmed and expired badges, dues reminders, admin to-dos)
-- ---------------------------------------------------------------------------

create or replace function public.notifications_sweep()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  since timestamptz := notifications_since();
  b player_badges;
  r record;
  pending_badges int;
  pending_claims int;
  next_auto timestamptz;
begin
  for b in
    select * from player_badges
    where badge_is_visible(status, auto_live_at) and expires_at > now()
      and case when status = 'live' then coalesce(decided_at, awarded_at) else auto_live_at end >= since
      and not exists (select 1 from notifications n where n.dedupe_key = 'badge-won:' || player_badges.id)
  loop
    perform notify_badge_won(b);
  end loop;

  for r in
    select pb.*, (
      select p.nickname from player_badges w join players p on p.id = w.player_id
      where w.badge_key = pb.badge_key and w.awarded_at >= pb.expires_at - interval '1 minute'
        and w.awarded_at <= pb.expires_at + interval '1 minute' and w.player_id <> pb.player_id
      limit 1
    ) as taken_by
    from player_badges pb
    where badge_is_visible(pb.status, pb.auto_live_at) and pb.expires_at <= now() and pb.expires_at >= since
  loop
    perform notify(
      player_user(r.player_id), 'badge_lost',
      jsonb_build_object('badge_id', r.id, 'badge_key', r.badge_key, 'period_key', r.period_key, 'expired_at', r.expires_at, 'taken_by', r.taken_by),
      '/awards/' || r.badge_key, null, 'badge-lost:' || r.id
    );
  end loop;

  for r in
    select q.*, p.id as player_id, p.user_id,
           case when q.due_date < current_date then 'late' else 'due' end as stage
    from dues_quarters q
    cross join players p
    where p.user_id is not null
      and q.due_date between current_date - 30 and current_date + 7
      and not exists (select 1 from dues_payments d where d.dues_quarter_id = q.id and d.player_id = p.id)
  loop
    perform notify(
      r.user_id, 'dues_' || r.stage,
      jsonb_build_object('quarter_id', r.id, 'year', r.year, 'quarter', r.quarter, 'amount', r.amount, 'due_date', r.due_date,
                         'paid_count', dues_paid_count(r.id), 'roster', public_roster_size()),
      '/kitty', null, 'dues-' || r.stage || ':' || r.id || ':' || r.player_id,
      'dues-' || r.stage, 'email_dues'
    );
  end loop;

  select count(*), min(auto_live_at) into pending_badges, next_auto
  from player_badges where status = 'pending' and auto_live_at > now();
  select count(*) into pending_claims from player_claims where status = 'pending';

  for r in select user_id from players where is_admin and user_id is not null loop
    if pending_badges + pending_claims = 0 then
      delete from notifications where dedupe_key = 'admin-todo:' || r.user_id;
    else
      insert into notifications (user_id, kind, data, link, dedupe_key)
      values (
        r.user_id, 'admin_todo',
        jsonb_build_object('badges', pending_badges, 'claims', pending_claims, 'next_auto_live', next_auto),
        case when pending_claims > 0 and pending_badges = 0 then '/admin/members' else '/admin/badges' end,
        'admin-todo:' || r.user_id
      )
      on conflict (dedupe_key) do update set
        data = excluded.data,
        link = excluded.link,
        read_at = case
          when (excluded.data->>'badges')::int > (notifications.data->>'badges')::int
            or (excluded.data->>'claims')::int > (notifications.data->>'claims')::int then null
          else notifications.read_at end,
        created_at = case
          when (excluded.data->>'badges')::int > (notifications.data->>'badges')::int
            or (excluded.data->>'claims')::int > (notifications.data->>'claims')::int then now()
          else notifications.created_at end;
    end if;
  end loop;
end;
$$;
revoke all on function public.notifications_sweep() from public, anon, authenticated;

-- New pending badges and claims should reach admins straight away, not on the next sweep.
create or replace function public.sweep_after_admin_queue_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform notifications_sweep();
  return null;
end;
$$;
create trigger player_badges_queue_sweep after insert or update of status on public.player_badges
  for each statement execute function public.sweep_after_admin_queue_change();
create trigger player_claims_queue_sweep after insert or update of status on public.player_claims
  for each statement execute function public.sweep_after_admin_queue_change();

-- ---------------------------------------------------------------------------
-- Email dispatch
-- ---------------------------------------------------------------------------

create or replace function public.dispatch_emails()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  url text;
begin
  select value into url from app_config where key = 'send_emails_url';
  if url is null or not exists (select 1 from email_outbox where sent_at is null and attempts < 5) then
    return;
  end if;
  perform net.http_post(url := url, body := '{}'::jsonb, headers := '{"Content-Type": "application/json"}'::jsonb);
end;
$$;
revoke all on function public.dispatch_emails() from public, anon, authenticated;

create or replace function public.dispatch_emails_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform dispatch_emails();
  return null;
end;
$$;
create trigger email_outbox_dispatch after insert on public.email_outbox
  for each statement execute function public.dispatch_emails_trigger();

-- Called by the edge function with the service role.
create or replace function public.claim_email_batch(p_limit int default 20)
returns setof email_outbox
language sql
security definer
set search_path = public
as $$
  update email_outbox set locked_at = now(), attempts = attempts + 1
  where id in (
    select id from email_outbox
    where sent_at is null and attempts < 5 and (locked_at is null or locked_at < now() - interval '5 minutes')
    order by created_at
    limit p_limit
    for update skip locked
  )
  returning *;
$$;
revoke all on function public.claim_email_batch(int) from public, anon, authenticated;
grant execute on function public.claim_email_batch(int) to service_role;

create or replace function public.finish_email(p_id uuid, p_error text default null)
returns void
language sql
security definer
set search_path = public
as $$
  update email_outbox
  set sent_at = case when p_error is null then now() end, last_error = p_error, locked_at = null
  where id = p_id;
$$;
revoke all on function public.finish_email(uuid, text) from public, anon, authenticated;
grant execute on function public.finish_email(uuid, text) to service_role;

select cron.schedule('notifications-sweep', '*/5 * * * *', 'select public.notifications_sweep()');
select cron.schedule('emails-retry', '*/5 * * * *', 'select public.dispatch_emails()');
