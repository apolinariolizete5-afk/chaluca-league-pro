-- Roles
CREATE TYPE public.app_role AS ENUM ('admin');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  email text,
  full_name text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile write" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE POLICY "admins read roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin() OR user_id = auth.uid());

-- Invites
CREATE TABLE public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  invited_by uuid,
  expires_at timestamptz NOT NULL DEFAULT now() + interval '7 days',
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.admin_invites TO authenticated;
GRANT ALL ON public.admin_invites TO service_role;
ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage invites" ON public.admin_invites FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE OR REPLACE FUNCTION public.invite_email(_token text)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT email FROM public.admin_invites
  WHERE token = _token AND used_at IS NULL AND expires_at > now()
  LIMIT 1
$$;
GRANT EXECUTE ON FUNCTION public.invite_email(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.accept_admin_invite(_token text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE inv public.admin_invites;
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  SELECT * INTO inv FROM public.admin_invites
    WHERE token = _token AND used_at IS NULL AND expires_at > now() LIMIT 1;
  IF inv.id IS NULL THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role, email)
    VALUES (auth.uid(), 'admin', inv.email)
    ON CONFLICT (user_id, role) DO NOTHING;
  UPDATE public.admin_invites SET used_at = now() WHERE id = inv.id;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.accept_admin_invite(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.admins_exist()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin')
$$;
GRANT EXECUTE ON FUNCTION public.admins_exist() TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.claim_first_admin()
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN false; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN RETURN false; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (auth.uid(), 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.claim_first_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.remove_admin(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_admin() THEN RETURN false; END IF;
  IF _user_id = auth.uid() THEN RETURN false; END IF;
  DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.remove_admin(uuid) TO authenticated;

-- Teams / players
CREATE TABLE public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_name text,
  logo_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.teams TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "admins write teams" ON public.teams FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TABLE public.players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  name text NOT NULL,
  photo_url text,
  shirt_number int,
  position text,
  registered boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.players TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read players" ON public.players FOR SELECT USING (true);
CREATE POLICY "admins write players" ON public.players FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Matches
CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  round int,
  kickoff timestamptz NOT NULL,
  venue text,
  home_team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  away_team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  home_score int,
  away_score int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.matches TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read matches" ON public.matches FOR SELECT USING (true);
CREATE POLICY "admins write matches" ON public.matches FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TYPE public.event_type AS ENUM ('goal', 'yellow', 'red');

CREATE TABLE public.match_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id uuid REFERENCES public.players(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  type public.event_type NOT NULL,
  minute int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.match_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.match_events TO authenticated;
GRANT ALL ON public.match_events TO service_role;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read events" ON public.match_events FOR SELECT USING (true);
CREATE POLICY "admins write events" ON public.match_events FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Posts
CREATE TABLE public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  excerpt text,
  content text,
  cover_url text,
  images text[] NOT NULL DEFAULT '{}',
  published boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.posts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.posts TO authenticated;
GRANT ALL ON public.posts TO service_role;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read posts" ON public.posts FOR SELECT USING (published = true);
CREATE POLICY "admins read all posts" ON public.posts FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "admins write posts" ON public.posts FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Settings
CREATE TABLE public.site_settings (
  id int PRIMARY KEY DEFAULT 1,
  site_name text NOT NULL DEFAULT 'Campeonato Recreativo de Chalucuane',
  tagline text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.site_settings TO authenticated;
GRANT ALL ON public.site_settings TO service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "admins write settings" ON public.site_settings FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
INSERT INTO public.site_settings (id, site_name, tagline) VALUES (1, 'Campeonato Recreativo de Chalucuane', 'O campeonato da nossa comunidade');

-- Standings view (auto-derived from played matches)
CREATE OR REPLACE VIEW public.standings
WITH (security_invoker = true) AS
WITH rows AS (
  SELECT home_team_id AS team_id, home_score AS gf, away_score AS ga FROM public.matches
    WHERE home_score IS NOT NULL AND away_score IS NOT NULL
  UNION ALL
  SELECT away_team_id AS team_id, away_score AS gf, home_score AS ga FROM public.matches
    WHERE home_score IS NOT NULL AND away_score IS NOT NULL
)
SELECT
  t.id AS team_id,
  t.name AS team_name,
  t.logo_url,
  COUNT(r.team_id)::int AS played,
  COALESCE(SUM((r.gf > r.ga)::int), 0)::int AS wins,
  COALESCE(SUM((r.gf = r.ga)::int), 0)::int AS draws,
  COALESCE(SUM((r.gf < r.ga)::int), 0)::int AS losses,
  COALESCE(SUM(r.gf), 0)::int AS goals_for,
  COALESCE(SUM(r.ga), 0)::int AS goals_against,
  COALESCE(SUM(r.gf - r.ga), 0)::int AS goal_diff,
  COALESCE(SUM((r.gf > r.ga)::int * 3 + (r.gf = r.ga)::int), 0)::int AS points
FROM public.teams t
LEFT JOIN rows r ON r.team_id = t.id
GROUP BY t.id, t.name, t.logo_url;
GRANT SELECT ON public.standings TO anon, authenticated, service_role;

-- Top scorers view
CREATE OR REPLACE VIEW public.top_scorers
WITH (security_invoker = true) AS
SELECT p.id AS player_id, p.name AS player_name, p.photo_url, t.id AS team_id, t.name AS team_name,
  COUNT(*) FILTER (WHERE e.type = 'goal')::int AS goals,
  COUNT(*) FILTER (WHERE e.type = 'yellow')::int AS yellows,
  COUNT(*) FILTER (WHERE e.type = 'red')::int AS reds
FROM public.match_events e
JOIN public.players p ON p.id = e.player_id
JOIN public.teams t ON t.id = p.team_id
GROUP BY p.id, p.name, p.photo_url, t.id, t.name;
GRANT SELECT ON public.top_scorers TO anon, authenticated, service_role;