-- A trait's creator earns a heart each time someone else votes for it, votes it onto a player,
-- picks it as their own, or tags it in a post or reply.

create or replace function public.trait_hearts(p_player uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  with mine as (select id, '(tag:' || id || ')' as token from tags where created_by = p_player)
  select (
    (select count(*) from tag_creation_votes v join mine on mine.id = v.tag_id where v.voter_id <> p_player)
    + (select count(*) from player_tag_votes v join mine on mine.id = v.tag_id where v.voter_id <> p_player)
    + (select count(*) from player_tags pt join mine on mine.id = pt.tag_id where pt.source = 'self' and pt.player_id <> p_player)
    + (select count(*) from posts po join mine on strpos(po.content, mine.token) > 0 where po.author_id <> p_player)
    + (select count(*) from post_replies r join mine on strpos(r.content, mine.token) > 0 where r.author_id <> p_player)
  )::integer;
$$;

revoke all on function public.trait_hearts(uuid) from public;
grant execute on function public.trait_hearts(uuid) to authenticated;
