import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin } from "lucide-react";
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

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário | Campeonato Recreativo de Chalucuane" },
      { name: "description", content: "Todos os jogos marcados do campeonato, data, hora e local." },
      { property: "og:title", content: "Calendário de jogos" },
      { property: "og:description", content: "Consulte os próximos jogos do campeonato." },
    ],
  }),
  component: Calendario,
});

function Calendario() {
  const { data: teams } = useQuery(teamsQuery);
  const { data: matches } = useQuery(matchesQuery);
  const upcoming = (matches ?? []).filter((m) => !isPlayed(m));

  return (
    <SiteLayout>
      <PageHeader title="Calendário" subtitle="Jogos marcados" />
      <div className="mx-auto w-full max-w-4xl space-y-3 px-4 py-10">
        {upcoming.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não há jogos marcados.</p>
        )}
        {upcoming.map((m) => (
          <div key={m.id} className="rounded-lg border border-border bg-card p-4">
            {m.round !== null && (
              <p className="mb-2 text-xs font-bold tracking-wide text-accent-foreground/70 uppercase">
                Jornada {m.round}
              </p>
            )}
            <div className="flex items-center justify-between gap-3">
              <div className="flex flex-1 items-center gap-2">
                <MediaImage
                  path={teamLogo(teams, m.home_team_id)}
                  alt={teamName(teams, m.home_team_id)}
                  className="size-9 rounded-full"
                />
                <span className="text-sm font-semibold">{teamName(teams, m.home_team_id)}</span>
              </div>
              <span className="text-xs font-bold text-muted-foreground">VS</span>
              <div className="flex flex-1 items-center justify-end gap-2 text-right">
                <span className="text-sm font-semibold">{teamName(teams, m.away_team_id)}</span>
                <MediaImage
                  path={teamLogo(teams, m.away_team_id)}
                  alt={teamName(teams, m.away_team_id)}
                  className="size-9 rounded-full"
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {formatDateTime(m.kickoff)}
              </span>
              {m.venue && (
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" />
                  {m.venue}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </SiteLayout>
  );
}
