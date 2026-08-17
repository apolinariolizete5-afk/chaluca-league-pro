import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  teamsQuery,
  playersQuery,
  matchesQuery,
  postsQuery,
  standingsQuery,
  scorersQuery,
  teamName,
  formatDateTime,
  isPlayed,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Painel | Campeonato Recreativo de Chalucuane" },
      { name: "description", content: "Painel de administração do campeonato." },
      { property: "og:title", content: "Painel de administração" },
      { property: "og:description", content: "Gestão do Campeonato Recreativo de Chalucuane." },
    ],
  }),
  component: AdminHome,
});

function useCountdown(iso?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!iso) return null;
  const diff = new Date(iso).getTime() - now;
  if (diff <= 0) return "A decorrer / terminado";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m ${s}s`;
}

function AdminHome() {
  const { data: teams } = useQuery(teamsQuery);
  const { data: players } = useQuery(playersQuery);
  const { data: matches } = useQuery(matchesQuery);
  const { data: posts } = useQuery(postsQuery);
  const { data: standings } = useQuery(standingsQuery);
  const { data: scorers } = useQuery(scorersQuery);

  const playedMatches = useMemo(() => (matches ?? []).filter(isPlayed), [matches]);
  const upcoming = useMemo(
    () =>
      (matches ?? [])
        .filter((m) => !isPlayed(m) && new Date(m.kickoff).getTime() > Date.now() - 2 * 3600000)
        .sort((a, b) => a.kickoff.localeCompare(b.kickoff)),
    [matches],
  );
  const next = upcoming[0];
  const countdown = useCountdown(next?.kickoff);

  const goals = (standings ?? []).reduce((n, s) => n + s.goals_for, 0);
  const avg = playedMatches.length ? (goals / playedMatches.length).toFixed(2) : "0.00";

  const byRound = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of playedMatches) {
      const key = m.round ? `J${m.round}` : "S/J";
      map.set(key, (map.get(key) ?? 0) + (m.home_score ?? 0) + (m.away_score ?? 0));
    }
    return [...map.entries()].map(([round, golos]) => ({ round, golos }));
  }, [playedMatches]);

  const topScorers = [...(scorers ?? [])].filter((s) => s.goals > 0).slice(0, 5);
  const topAssists = [...(scorers ?? [])]
    .filter((s) => s.assists > 0)
    .sort((a, b) => b.assists - a.assists)
    .slice(0, 5);
  const cards = [...(scorers ?? [])]
    .map((s) => ({ ...s, total: s.yellows + s.reds }))
    .filter((s) => s.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  const bestAttack = [...(standings ?? [])].sort((a, b) => b.goals_for - a.goals_for)[0];

  const stats = [
    { label: "Equipas", value: (teams ?? []).length },
    { label: "Jogadores", value: (players ?? []).length },
    { label: "Inscritos", value: (players ?? []).filter((p) => p.registered).length },
    { label: "Jogos por disputar", value: (matches ?? []).length - playedMatches.length },
    { label: "Jogos disputados", value: playedMatches.length },
    { label: "Golos marcados", value: goals },
    { label: "Média golos/jogo", value: avg },
    { label: "Publicações", value: (posts ?? []).length },
  ];

  const lastResults = [...playedMatches].sort((a, b) => b.kickoff.localeCompare(a.kickoff)).slice(0, 5);

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card-elevated p-5">
            <p className="font-display text-4xl leading-none text-primary">{s.value}</p>
            <p className="mt-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="card-elevated p-5">
          <h2 className="text-xl">Próximo jogo</h2>
          {next ? (
            <div className="mt-3">
              <p className="font-semibold">
                {teamName(teams, next.home_team_id)} vs {teamName(teams, next.away_team_id)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {formatDateTime(next.kickoff)}
                {next.venue ? ` · ${next.venue}` : ""}
              </p>
              <p className="mt-4 font-display text-3xl text-primary">{countdown}</p>
              <Link
                to="/admin/resultados"
                className="mt-4 inline-block text-sm font-semibold text-primary hover:underline"
              >
                Registar resultado →
              </Link>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Sem jogos agendados.</p>
          )}
          {bestAttack && (
            <p className="mt-6 text-sm text-muted-foreground">
              Melhor ataque: <span className="font-semibold text-foreground">{bestAttack.team_name}</span>{" "}
              ({bestAttack.goals_for} golos)
            </p>
          )}
        </section>

        <section className="card-elevated p-5">
          <h2 className="text-xl">Golos por jornada</h2>
          {byRound.length ? (
            <div className="mt-4 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byRound}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis dataKey="round" fontSize={12} />
                  <YAxis allowDecimals={false} fontSize={12} width={28} />
                  <Tooltip />
                  <Bar dataKey="golos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Ainda sem jogos disputados.</p>
          )}
        </section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <RankCard
          title="Melhores marcadores"
          rows={topScorers.map((s) => ({ id: s.player_id, name: s.player_name, sub: s.team_name, value: s.goals }))}
        />
        <RankCard
          title="Melhores assistentes"
          rows={topAssists.map((s) => ({ id: s.player_id, name: s.player_name, sub: s.team_name, value: s.assists }))}
        />
        <RankCard
          title="Disciplina (cartões)"
          rows={cards.map((s) => ({
            id: s.player_id,
            name: s.player_name,
            sub: `${s.yellows} amarelos · ${s.reds} vermelhos`,
            value: s.total,
          }))}
        />
      </div>

      <section>
        <h2 className="text-xl">Últimos resultados</h2>
        <div className="card-elevated mt-4 divide-y divide-border">
          {lastResults.map((m) => (
            <div key={m.id} className="flex items-center gap-3 p-4 text-sm">
              <span className="flex-1 text-right font-semibold">{teamName(teams, m.home_team_id)}</span>
              <span className="rounded-md bg-secondary px-3 py-1 font-bold">
                {m.home_score} – {m.away_score}
              </span>
              <span className="flex-1 font-semibold">{teamName(teams, m.away_team_id)}</span>
            </div>
          ))}
          {lastResults.length === 0 && (
            <p className="p-6 text-center text-sm text-muted-foreground">Sem resultados registados.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl">Classificação atual</h2>
        <div className="card-elevated mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-secondary text-xs text-muted-foreground">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Equipa</th>
                <th className="p-3">J</th>
                <th className="p-3">V</th>
                <th className="p-3">E</th>
                <th className="p-3">D</th>
                <th className="p-3">DG</th>
                <th className="p-3">Pts</th>
              </tr>
            </thead>
            <tbody>
              {(standings ?? []).map((s, i) => (
                <tr key={s.team_id} className="border-t border-border">
                  <td className="p-3 text-muted-foreground">{i + 1}</td>
                  <td className="p-3 font-semibold">{s.team_name}</td>
                  <td className="p-3 text-center">{s.played}</td>
                  <td className="p-3 text-center">{s.wins}</td>
                  <td className="p-3 text-center">{s.draws}</td>
                  <td className="p-3 text-center">{s.losses}</td>
                  <td className="p-3 text-center">{s.goal_diff}</td>
                  <td className="p-3 text-center font-bold">{s.points}</td>
                </tr>
              ))}
              {(standings ?? []).length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-muted-foreground">
                    Ainda não há equipas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function RankCard({
  title,
  rows,
}: {
  title: string;
  rows: { id: string; name: string; sub: string; value: number }[];
}) {
  return (
    <div className="card-elevated p-5">
      <h2 className="text-xl">{title}</h2>
      <ol className="mt-3 space-y-2 text-sm">
        {rows.map((r, i) => (
          <li key={r.id} className="flex items-center gap-3">
            <span className="w-4 text-muted-foreground">{i + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold">{r.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{r.sub}</span>
            </span>
            <span className="font-display text-2xl text-primary">{r.value}</span>
          </li>
        ))}
        {rows.length === 0 && <li className="text-muted-foreground">Sem dados ainda.</li>}
      </ol>
    </div>
  );
}
