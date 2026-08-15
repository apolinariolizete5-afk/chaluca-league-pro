import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { teamsQuery, playersQuery, matchesQuery, postsQuery, standingsQuery, isPlayed } from "@/lib/queries";

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

function AdminHome() {
  const { data: teams } = useQuery(teamsQuery);
  const { data: players } = useQuery(playersQuery);
  const { data: matches } = useQuery(matchesQuery);
  const { data: posts } = useQuery(postsQuery);
  const { data: standings } = useQuery(standingsQuery);

  const played = (matches ?? []).filter(isPlayed).length;
  const goals = (standings ?? []).reduce((n, s) => n + s.goals_for, 0);
  const stats = [
    { label: "Equipas", value: (teams ?? []).length },
    { label: "Jogadores", value: (players ?? []).length },
    { label: "Inscritos", value: (players ?? []).filter((p) => p.registered).length },
    { label: "Jogos marcados", value: (matches ?? []).length - played },
    { label: "Jogos disputados", value: played },
    { label: "Golos marcados", value: goals },
    { label: "Publicações", value: (posts ?? []).length },
    {
      label: "Publicadas",
      value: (posts ?? []).filter((p) => p.published).length,
    },
  ];

  return (
    <div>
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

      <h2 className="mt-10 text-xl">Classificação atual</h2>
      <div className="card-elevated mt-4 overflow-hidden">
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
    </div>
  );
}
