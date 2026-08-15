import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { useIsAdmin, useSession } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const TABS = [
  { to: "/admin", label: "Visão geral", exact: true },
  { to: "/admin/equipas", label: "Equipas" },
  { to: "/admin/calendario", label: "Calendário" },
  { to: "/admin/resultados", label: "Resultados" },
  { to: "/admin/publicacoes", label: "Publicações" },
  { to: "/admin/administradores", label: "Administradores" },
] as const;

function AdminLayout() {
  const navigate = useNavigate();
  const { user } = useSession();
  const { data: isAdmin, isLoading } = useIsAdmin(user?.id);

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
          <h1 className="text-2xl font-bold">Sem permissões</h1>
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

  return (
    <SiteLayout>
      <div className="pitch-gradient text-primary-foreground">
        <div className="mx-auto w-full max-w-6xl px-4 py-8">
          <p className="text-xs font-bold tracking-[0.25em] text-accent uppercase">Administração</p>
          <h1 className="mt-1 text-3xl">Painel do campeonato</h1>
          <div className="mt-5 flex flex-wrap gap-2">
            {TABS.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                activeOptions={{ exact: "exact" in t ? t.exact : false }}
                className="rounded-full border border-primary-foreground/25 px-4 py-1.5 text-sm font-semibold transition-colors hover:bg-primary-foreground/10 [&.active]:bg-accent [&.active]:text-accent-foreground"
              >
                {t.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                toast.success("Sessão terminada");
                void navigate({ to: "/" });
              }}
              className="ml-auto rounded-full border border-primary-foreground/25 px-4 py-1.5 text-sm font-semibold hover:bg-primary-foreground/10"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
      <div className="mx-auto w-full max-w-6xl px-4 py-10">
        <Outlet />
      </div>
    </SiteLayout>
  );
}
