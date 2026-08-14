import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { MediaImage } from "@/components/MediaImage";
import { teamsQuery, playersQuery } from "@/lib/queries";

export const Route = createFileRoute("/equipas")({
  head: () => ({
    meta: [
      { title: "Equipas | Campeonato Recreativo de Chalucuane" },
      {
        name: "description",
        content: "Equipas e plantéis inscritos no Campeonato Recreativo de Chalucuane.",
      },
      { property: "og:title", content: "Equipas do campeonato" },
      { property: "og:description", content: "Conheça as equipas e os jogadores inscritos." },
    ],
  }),
  component: Equipas,
});

function Equipas() {
  const { data: teams } = useQuery(teamsQuery);
  const { data: players } = useQuery(playersQuery);
  const [openTeam, setOpenTeam] = useState<string | null>(null);

  return (
    <SiteLayout>
      <PageHeader title="Equipas" subtitle="Plantéis do campeonato" />
      <div className="mx-auto grid w-full max-w-6xl gap-4 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {(teams ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não há equipas registadas.</p>
        )}
        {(teams ?? []).map((t) => {
          const squad = (players ?? []).filter((p) => p.team_id === t.id);
          const open = openTeam === t.id;
          return (
            <div key={t.id} className="rounded-lg border border-border bg-card p-4">
              <button
                type="button"
                onClick={() => setOpenTeam(open ? null : t.id)}
                className="flex w-full items-center gap-3 text-left"
              >
                <MediaImage path={t.logo_url} alt={t.name} className="size-12 rounded-full" />
                <span>
                  <span className="block font-bold">{t.name}</span>
                  <span className="block text-xs text-muted-foreground">
                    {squad.filter((p) => p.registered).length} jogadores inscritos
                  </span>
                </span>
              </button>

              {open && (
                <ul className="mt-4 space-y-2 border-t border-border pt-3">
                  {squad.length === 0 && (
                    <li className="text-xs text-muted-foreground">Sem jogadores.</li>
                  )}
                  {squad.map((p) => (
                    <li key={p.id} className="flex items-center gap-3">
                      <MediaImage path={p.photo_url} alt={p.name} className="size-8 rounded-full" />
                      <span className="flex-1 text-sm">{p.name}</span>
                      {p.shirt_number !== null && (
                        <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold">
                          {p.shirt_number}
                        </span>
                      )}
                      <span
                        className={
                          p.registered
                            ? "text-xs font-semibold text-primary"
                            : "text-xs text-muted-foreground"
                        }
                      >
                        {p.registered ? "Inscrito" : "Não inscrito"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </SiteLayout>
  );
}
