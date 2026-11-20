-- Re-checks payments with Paystack every 5 minutes, so a charge that succeeded is recorded even if the
-- player's browser never came back and the webhook never arrived. Anything Paystack has that Astro
-- can't match lands in paystack_unmatched for an admin.

alter table payments add column checked_at timestamptz;
alter table payments add column check_count int not null default 0;

create table paystack_unmatched (
  id uuid primary key default gen_random_uuid(),
  provider_ref text not null unique,
  reference text not null,
  payment_id uuid references payments(id) on delete set null,
  amount_kobo bigint not null,
  currency text not null,
  customer_email text,
  paid_at timestamptz,
  reason text not null,
  first_seen_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references players(id),
  resolution_note text
);

alter table paystack_unmatched enable row level security;
create policy paystack_unmatched_select_admin on paystack_unmatched for select to authenticated using (is_requesting_admin());

-- Hands out a batch of payments to re-check and stamps them, backing off the more often one has been checked.
-- Cancelled ones are included because an older checkout tab can still be paid after a newer one replaced it.
create function payments_to_reconcile(p_limit int default 25)
returns setof payments
language sql
security definer
set search_path = public
as $$
  update payments set checked_at = now(), check_count = check_count + 1
  where id in (
    select id from payments
    where status in ('pending', 'cancelled')
      and created_at > now() - interval '3 days'
      and (checked_at is null or checked_at < now() - make_interval(mins => least(1 + check_count * 2, 60)))
    order by checked_at nulls first, created_at
    limit p_limit
    for update skip locked
  )
  returning *;
$$;

revoke all on function payments_to_reconcile(int) from public, anon, authenticated;
grant execute on function payments_to_reconcile(int) to service_role;

create function record_paystack_unmatched(
  p_provider_ref text,
  p_reference text,
  p_amount_kobo bigint,
  p_currency text,
  p_customer_email text,
  p_paid_at timestamptz,
  p_reason text
)
returns paystack_unmatched
language sql
security definer
set search_path = public
as $$
  insert into paystack_unmatched (provider_ref, reference, payment_id, amount_kobo, currency, customer_email, paid_at, reason)
  values (
    p_provider_ref, p_reference, (select id from payments where reference = p_reference),
    p_amount_kobo, p_currency, p_customer_email, p_paid_at, p_reason
  )
  on conflict (provider_ref) do update set reason = excluded.reason, payment_id = excluded.payment_id
  where paystack_unmatched.resolved_at is null
  returning *;
$$;

revoke all on function record_paystack_unmatched(text, text, bigint, text, text, timestamptz, text) from public, anon, authenticated;
grant execute on function record_paystack_unmatched(text, text, bigint, text, text, timestamptz, text) to service_role;

-- Once the re-check has recorded a payment, its unmatched entry closes itself.
create function close_matched_unmatched()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status in ('paid', 'refund_due', 'refunded') and old.status is distinct from new.status then
    update paystack_unmatched set resolved_at = now(), resolution_note = 'Recorded by Astro'
    where reference = new.reference and resolved_at is null;
  end if;
  return null;
end;
$$;

create trigger payments_close_unmatched after update of status on payments
  for each row execute function close_matched_unmatched();

create function resolve_paystack_unmatched(p_id uuid, p_note text)
returns paystack_unmatched
language plpgsql
security definer
set search_path = public
as $$
declare
  result paystack_unmatched;
begin
  if not is_requesting_admin() then
    raise exception 'Only admins can do that';
  end if;
  update paystack_unmatched set resolved_at = now(), resolution_note = nullif(trim(p_note), ''),
    resolved_by = (select id from players where user_id = auth.uid())
  where id = p_id and resolved_at is null
  returning * into result;
  if result.id is null then
    raise exception 'That one is already resolved';
  end if;
  return result;
end;
$$;

revoke all on function resolve_paystack_unmatched(uuid, text) from public;
grant execute on function resolve_paystack_unmatched(uuid, text) to authenticated;

insert into app_config (key, value) values
  ('payments_reconcile_url', 'http://supabase_kong_astro:8000/functions/v1/payments-reconcile')
on conflict (key) do nothing;

create function dispatch_payments_reconcile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  url text;
begin
  select value into url from app_config where key = 'payments_reconcile_url';
  if url is null then
    return;
  end if;
  perform net.http_post(url := url, body := '{}'::jsonb, headers := '{"Content-Type": "application/json"}'::jsonb);
end;
$$;

revoke all on function dispatch_payments_reconcile() from public, anon, authenticated;

select cron.schedule('payments-reconcile', '*/5 * * * *', 'select public.dispatch_payments_reconcile()');
