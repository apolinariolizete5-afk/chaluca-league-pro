import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { MediaImage } from "@/components/MediaImage";
import { standingsQuery, scorersQuery } from "@/lib/queries";

export const Route = createFileRoute("/classificacao")({
  head: () => ({
    meta: [
      { title: "Classificação | Campeonato Recreativo de Chalucuane" },
      {
        name: "description",
        content: "Tabela classificativa e melhores marcadores, atualizadas automaticamente.",
      },
      { property: "og:title", content: "Classificação e estatísticas" },
      { property: "og:description", content: "Tabela e melhores marcadores do campeonato." },
    ],
  }),
  component: Classificacao,
});

function Classificacao() {
  const { data: standings } = useQuery(standingsQuery);
  const { data: scorers } = useQuery(scorersQuery);

  return (
    <SiteLayout>
      <PageHeader title="Classificação" subtitle="Atualizada automaticamente" />
      <div className="mx-auto w-full max-w-5xl space-y-10 px-4 py-10">
        <div className="overflow-x-auto rounded-lg border border-border bg-card">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="bg-secondary text-xs text-muted-foreground">
              <tr>
                <th className="p-3 text-left">#</th>
                <th className="p-3 text-left">Equipa</th>
                <th className="p-3">J</th>
                <th className="p-3">V</th>
                <th className="p-3">E</th>
                <th className="p-3">D</th>
                <th className="p-3">GM</th>
                <th className="p-3">GS</th>
                <th className="p-3">DG</th>
                <th className="p-3">Pts</th>
              </tr>
            </thead>
            <tbody>
              {(standings ?? []).map((s, i) => (
                <tr key={s.team_id} className="border-t border-border">
                  <td className="p-3 text-muted-foreground">{i + 1}</td>
                  <td className="p-3">
                    <span className="flex items-center gap-2 font-medium">
                      <MediaImage
                        path={s.logo_url}
                        alt={s.team_name}
                        className="size-7 rounded-full"
                      />
                      {s.team_name}
                    </span>
                  </td>
                  <td className="p-3 text-center">{s.played}</td>
                  <td className="p-3 text-center">{s.wins}</td>
                  <td className="p-3 text-center">{s.draws}</td>
                  <td className="p-3 text-center">{s.losses}</td>
                  <td className="p-3 text-center">{s.goals_for}</td>
                  <td className="p-3 text-center">{s.goals_against}</td>
                  <td className="p-3 text-center">{s.goal_diff}</td>
                  <td className="p-3 text-center font-bold">{s.points}</td>
                </tr>
              ))}
              {(standings ?? []).length === 0 && (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-muted-foreground">
                    Sem equipas registadas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="text-lg font-bold">Melhores marcadores</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-xs text-muted-foreground">
                <tr>
                  <th className="p-3 text-left">Jogador</th>
                  <th className="p-3 text-left">Equipa</th>
                  <th className="p-3">Golos</th>
                  <th className="p-3">Amarelos</th>
                  <th className="p-3">Vermelhos</th>
                </tr>
              </thead>
              <tbody>
                {(scorers ?? []).map((s) => (
                  <tr key={s.player_id} className="border-t border-border">
                    <td className="p-3">
                      <span className="flex items-center gap-2 font-medium">
                        <MediaImage
                          path={s.photo_url}
                          alt={s.player_name}
                          className="size-7 rounded-full"
                        />
                        {s.player_name}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{s.team_name}</td>
                    <td className="p-3 text-center font-bold">{s.goals}</td>
                    <td className="p-3 text-center">{s.yellows}</td>
                    <td className="p-3 text-center">{s.reds}</td>
                  </tr>
                ))}
                {(scorers ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-muted-foreground">
                      Sem estatísticas ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </SiteLayout>
  );
}
