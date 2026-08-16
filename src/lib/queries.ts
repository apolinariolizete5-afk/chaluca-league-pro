import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Team = {
  id: string;
  name: string;
  short_name: string | null;
  logo_url: string | null;
};

export type Player = {
  id: string;
  team_id: string;
  name: string;
  photo_url: string | null;
  shirt_number: number | null;
  position: string | null;
  registered: boolean;
};

export type Match = {
  id: string;
  round: number | null;
  kickoff: string;
  venue: string | null;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
};

export type Post = {
  id: string;
  title: string;
  excerpt: string | null;
  content: string | null;
  cover_url: string | null;
  images: string[];
  published: boolean;
  created_at: string;
};

export type Standing = {
  team_id: string;
  team_name: string;
  logo_url: string | null;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  goal_diff: number;
  points: number;
};

export type Scorer = {
  player_id: string;
  player_name: string;
  photo_url: string | null;
  team_id: string;
  team_name: string;
  goals: number;
  assists: number;
  yellows: number;
  reds: number;
};

export const teamsQuery = queryOptions({
  queryKey: ["teams"],
  queryFn: async (): Promise<Team[]> => {
    const { data, error } = await supabase
      .from("teams")
      .select("id,name,short_name,logo_url")
      .order("name");
    if (error) throw error;
    return data ?? [];
  },
});

export const playersQuery = queryOptions({
  queryKey: ["players"],
  queryFn: async (): Promise<Player[]> => {
    const { data, error } = await supabase
      .from("players")
      .select("id,team_id,name,photo_url,shirt_number,position,registered")
      .order("shirt_number", { nullsFirst: false });
    if (error) throw error;
    return data ?? [];
  },
});

export const matchesQuery = queryOptions({
  queryKey: ["matches"],
  queryFn: async (): Promise<Match[]> => {
    const { data, error } = await supabase
      .from("matches")
      .select("id,round,kickoff,venue,home_team_id,away_team_id,home_score,away_score")
      .order("kickoff");
    if (error) throw error;
    return data ?? [];
  },
});

export const standingsQuery = queryOptions({
  queryKey: ["standings"],
  queryFn: async (): Promise<Standing[]> => {
    const { data, error } = await supabase.from("standings").select("*");
    if (error) throw error;
    return ((data ?? []) as Standing[]).sort(
      (a, b) =>
        b.points - a.points ||
        b.goal_diff - a.goal_diff ||
        b.goals_for - a.goals_for ||
        a.team_name.localeCompare(b.team_name),
    );
  },
});

export const scorersQuery = queryOptions({
  queryKey: ["scorers"],
  queryFn: async (): Promise<Scorer[]> => {
    const { data, error } = await supabase.from("top_scorers").select("*");
    if (error) throw error;
    return ((data ?? []) as Scorer[]).sort(
      (a, b) => b.goals - a.goals || b.assists - a.assists,
    );
  },
});

export const postsQuery = queryOptions({
  queryKey: ["posts"],
  queryFn: async (): Promise<Post[]> => {
    const { data, error } = await supabase
      .from("posts")
      .select("id,title,excerpt,content,cover_url,images,published,created_at")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Post[];
  },
});

export function teamName(teams: Team[] | undefined, id: string) {
  return teams?.find((t) => t.id === id)?.name ?? "—";
}

export function teamLogo(teams: Team[] | undefined, id: string) {
  return teams?.find((t) => t.id === id)?.logo_url ?? null;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const isPlayed = (m: Match) => m.home_score !== null && m.away_score !== null;
