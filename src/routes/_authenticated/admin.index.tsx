import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { useSession, useIsAdmin } from "@/hooks/use-auth";
import { teamsQuery, playersQuery, matchesQuery, postsQuery, isPlayed } from "@/lib/queries";

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
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: isAdmin, isLoading } = useIsAdmin(user?.id);
  const { data: teams } = useQuery(teamsQuery);
  const { data: players } = useQuery(playersQuery);
  const { data: matches } = useQuery(matchesQuery);
  const { data: posts } = useQuery(postsQuery);

  if (isLoading) {
    return (
      <SiteLayout>
        <p className="mx-auto max-w-6xl px-4 py-16 text-sm text-muted-foreground">A carregar…</p>
      </SiteLayout>
    );
  }

  if (!isAdmin) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-bold">Sem permissões</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            A sua conta não é administradora. Peça um convite a um administrador.
          </p>
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut();
              toast.success("Sessão terminada");
              void navigate({ to: "/auth" });
            }}
            className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
          >
            Terminar sessão
          </button>
        </div>
      </SiteLayout>
    );
  }

  const played = (matches ?? []).filter(isPlayed).length;
  const stats = [
    { label: "Equipas", value: (teams ?? []).length },
    { label: "Jogadores", value: (players ?? []).length },
    { label: "Jogos marcados", value: (matches ?? []).length - played },
    { label: "Jogos disputados", value: played },
    { label: "Publicações", value: (posts ?? []).length },
  ];

  return (
    <SiteLayout>
      <PageHeader title="Painel de administração" subtitle="Visão geral do campeonato" />
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="rounded-lg border border-border bg-card p-4">
              <p className="text-2xl font-extrabold">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-8 text-sm text-muted-foreground">
          As abas de gestão (equipas, calendário, resultados, publicações e convites) são
          adicionadas em seguida.
        </p>
      </div>
    </SiteLayout>
  );
}
