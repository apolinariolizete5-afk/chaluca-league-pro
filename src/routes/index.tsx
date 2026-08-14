import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, MapPin } from "lucide-react";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { MediaImage } from "@/components/MediaImage";
import {
  matchesQuery,
  teamsQuery,
  standingsQuery,
  postsQuery,
  teamName,
  teamLogo,
  formatDateTime,
  formatDate,
  isPlayed,
} from "@/lib/queries";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Campeonato Recreativo de Chalucuane" },
      {
        name: "description",
        content:
          "Resultados, calendário, classificação, equipas e notícias do Campeonato Recreativo de Chalucuane.",
      },
      { property: "og:title", content: "Campeonato Recreativo de Chalucuane" },
      {
        property: "og:description",
        content: "Resultados, calendário, classificação e notícias do campeonato.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: teams } = useQuery(teamsQuery);
  const { data: matches } = useQuery(matchesQuery);
  const { data: standings } = useQuery(standingsQuery);
  const { data: posts } = useQuery(postsQuery);

  const upcoming = (matches ?? []).filter((m) => !isPlayed(m)).slice(0, 4);
  const recent = (matches ?? [])
    .filter(isPlayed)
    .sort((a, b) => +new Date(b.kickoff) - +new Date(a.kickoff))
    .slice(0, 4);
  const news = (posts ?? []).filter((p) => p.published).slice(0, 3);

  return (
    <SiteLayout>
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:py-20">
          <p className="text-xs font-bold tracking-[0.2em] text-accent uppercase">
            Bem-vindo ao campeonato
          </p>
          <h1 className="mt-3 max-w-2xl text-3xl leading-tight font-extrabold sm:text-5xl">
            Campeonato Recreativo de Chalucuane
          </h1>
          <p className="mt-4 max-w-xl text-sm text-primary-foreground/80 sm:text-base">
            Acompanhe os jogos, os resultados ao minuto, a classificação atualizada
            automaticamente e as notícias das equipas da nossa comunidade.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              to="/classificacao"
              className="rounded-md bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground"
            >
              Ver classificação
            </Link>
            <Link
              to="/calendario"
              className="rounded-md border border-primary-foreground/30 px-5 py-2.5 text-sm font-semibold"
            >
              Calendário
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 lg:grid-cols-3">
        <section className="lg:col-span-2">
          <h2 className="text-lg font-bold">Próximos jogos</h2>
          <div className="mt-4 space-y-3">
            {upcoming.length === 0 && (
              <p className="text-sm text-muted-foreground">Ainda não há jogos marcados.</p>
            )}
            {upcoming.map((m) => (
              <div key={m.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex flex-1 items-center gap-2">
                    <MediaImage
                      path={teamLogo(teams, m.home_team_id)}
                      alt={teamName(teams, m.home_team_id)}
                      className="size-8 rounded-full"
                    />
                    <span className="text-sm font-semibold">{teamName(teams, m.home_team_id)}</span>
                  </div>
                  <span className="text-xs font-bold text-muted-foreground">VS</span>
                  <div className="flex flex-1 items-center justify-end gap-2 text-right">
                    <span className="text-sm font-semibold">{teamName(teams, m.away_team_id)}</span>
                    <MediaImage
                      path={teamLogo(teams, m.away_team_id)}
                      alt={teamName(teams, m.away_team_id)}
                      className="size-8 rounded-full"
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

          <h2 className="mt-10 text-lg font-bold">Últimos resultados</h2>
          <div className="mt-4 space-y-3">
            {recent.length === 0 && (
              <p className="text-sm text-muted-foreground">Ainda não há resultados.</p>
            )}
            {recent.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-border bg-card p-4"
              >
                <span className="flex-1 text-sm font-semibold">
                  {teamName(teams, m.home_team_id)}
                </span>
                <span className="rounded-md bg-primary px-3 py-1 text-sm font-bold text-primary-foreground">
                  {m.home_score} - {m.away_score}
                </span>
                <span className="flex-1 text-right text-sm font-semibold">
                  {teamName(teams, m.away_team_id)}
                </span>
              </div>
            ))}
          </div>
        </section>

        <aside>
          <h2 className="text-lg font-bold">Classificação</h2>
          <div className="mt-4 overflow-hidden rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-secondary text-xs text-muted-foreground">
                <tr>
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Equipa</th>
                  <th className="p-2">J</th>
                  <th className="p-2">Pts</th>
                </tr>
              </thead>
              <tbody>
                {(standings ?? []).slice(0, 6).map((s, i) => (
                  <tr key={s.team_id} className="border-t border-border">
                    <td className="p-2 text-muted-foreground">{i + 1}</td>
                    <td className="p-2 font-medium">{s.team_name}</td>
                    <td className="p-2 text-center">{s.played}</td>
                    <td className="p-2 text-center font-bold">{s.points}</td>
                  </tr>
                ))}
                {(standings ?? []).length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">
                      Sem equipas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <h2 className="mt-10 text-lg font-bold">Notícias</h2>
          <div className="mt-4 space-y-3">
            {news.length === 0 && (
              <p className="text-sm text-muted-foreground">Sem publicações ainda.</p>
            )}
            {news.map((p) => (
              <Link
                key={p.id}
                to="/noticias/$id"
                params={{ id: p.id }}
                className="block overflow-hidden rounded-lg border border-border bg-card"
              >
                <MediaImage path={p.cover_url} alt={p.title} className="h-32 w-full" />
                <div className="p-3">
                  <p className="text-sm font-semibold">{p.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        </aside>
      </div>
    </SiteLayout>
  );
}
