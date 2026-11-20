-- payments-reconcile is called by pg_cron with no JWT, so the function checks a shared secret itself.
-- app_config has RLS on and no policies: only security definer functions and the service role can read it.
insert into app_config (key, value) values
  ('payments_reconcile_secret', replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;

create or replace function dispatch_payments_reconcile()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  url text;
  secret text;
begin
  select value into url from app_config where key = 'payments_reconcile_url';
  select value into secret from app_config where key = 'payments_reconcile_secret';
  if url is null or secret is null then
    return;
  end if;
  perform net.http_post(
    url := url,
    body := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-reconcile-secret', secret)
  );
end;
$$;

revoke all on function dispatch_payments_reconcile() from public, anon, authenticated;
