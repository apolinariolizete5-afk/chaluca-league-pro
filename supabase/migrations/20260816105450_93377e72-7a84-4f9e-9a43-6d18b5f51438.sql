DROP VIEW IF EXISTS public.top_scorers;
CREATE VIEW public.top_scorers WITH (security_invoker = true) AS
SELECT p.id AS player_id,
  p.name AS player_name,
  p.photo_url,
  t.id AS team_id,
  t.name AS team_name,
  (count(*) FILTER (WHERE e.type = 'goal'::event_type))::integer AS goals,
  (count(*) FILTER (WHERE e.type = 'assist'::event_type))::integer AS assists,
  (count(*) FILTER (WHERE e.type = 'yellow'::event_type))::integer AS yellows,
  (count(*) FILTER (WHERE e.type = 'red'::event_type))::integer AS reds
FROM match_events e
JOIN players p ON p.id = e.player_id
JOIN teams t ON t.id = p.team_id
GROUP BY p.id, p.name, p.photo_url, t.id, t.name;
GRANT SELECT ON public.top_scorers TO anon, authenticated;
GRANT ALL ON public.top_scorers TO service_role;