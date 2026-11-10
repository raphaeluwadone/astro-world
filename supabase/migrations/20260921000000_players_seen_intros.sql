-- Page intros a player has dismissed, by key (e.g. 'salami-cup'), so each shows once per account rather than per device.
alter table players add column seen_intros text[] not null default '{}';
