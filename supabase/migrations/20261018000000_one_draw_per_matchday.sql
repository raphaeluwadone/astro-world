-- A matchday has one draw: a second publish (double tap, two admins) can't add another set of sides.
create unique index teams_matchday_greek_name on teams (matchday_id, greek_name);
