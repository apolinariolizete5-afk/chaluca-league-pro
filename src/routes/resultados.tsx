import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { MediaImage } from "@/components/MediaImage";
import {
  matchesQuery,
  teamsQuery,
  teamName,
  teamLogo,
  formatDateTime,
  isPlayed,
} from "@/lib/queries";

export const Route = createFileRoute("/resultados")({
  head: () => ({
    meta: [
      { title: "Resultados | Campeonato Recreativo de Chalucuane" },
      { name: "description", content: "Resultados de todos os jogos disputados no campeonato." },
      { property: "og:title", content: "Resultados do campeonato" },
      { property: "og:description", content: "Veja os resultados dos jogos já disputados." },
    ],
  }),
  component: Resultados,
});

function Resultados() {
  const { data: teams } = useQuery(teamsQuery);
  const { data: matches } = useQuery(matchesQuery);
  const played = (matches ?? [])
    .filter(isPlayed)
    .sort((a, b) => +new Date(b.kickoff) - +new Date(a.kickoff));

  return (
    <SiteLayout>
      <PageHeader title="Resultados" subtitle="Jogos disputados" />
      <div className="mx-auto w-full max-w-4xl space-y-3 px-4 py-10">
        {played.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não há resultados registados.</p>
        )}
        {played.map((m) => (
          <div key={m.id} className="rounded-lg border border-border bg-card p-4">
            <p className="mb-2 text-xs text-muted-foreground">
              {m.round !== null ? `Jornada ${m.round} · ` : ""}
              {formatDateTime(m.kickoff)}
            </p>
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-2">
                <MediaImage
                  path={teamLogo(teams, m.home_team_id)}
                  alt={teamName(teams, m.home_team_id)}
                  className="size-9 rounded-full"
                />
                <span className="text-sm font-semibold">{teamName(teams, m.home_team_id)}</span>
              </div>
              <span className="rounded-md bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                {m.home_score} - {m.away_score}
              </span>
              <div className="flex flex-1 items-center justify-end gap-2 text-right">
                <span className="text-sm font-semibold">{teamName(teams, m.away_team_id)}</span>
                <MediaImage
                  path={teamLogo(teams, m.away_team_id)}
                  alt={teamName(teams, m.away_team_id)}
                  className="size-9 rounded-full"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </SiteLayout>
  );
}
