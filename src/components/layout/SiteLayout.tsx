import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, Trophy, X } from "lucide-react";
import { useSession, useIsAdmin } from "@/hooks/use-auth";

const NAV = [
  { to: "/", label: "Início" },
  { to: "/equipas", label: "Equipas" },
  { to: "/calendario", label: "Calendário" },
  { to: "/resultados", label: "Resultados" },
  { to: "/classificacao", label: "Classificação" },
  { to: "/noticias", label: "Notícias" },
] as const;

export function SiteLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { user } = useSession();
  const { data: isAdmin } = useIsAdmin(user?.id);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-primary text-primary-foreground">
        <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
              <Trophy className="size-5" />
            </span>
            <span className="text-sm leading-tight font-extrabold tracking-tight uppercase">
              Campeonato Recreativo
              <span className="block text-accent">de Chalucuane</span>
            </span>
          </Link>

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                activeOptions={{ exact: item.to === "/" }}
                className="rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-foreground/10 [&.active]:bg-accent [&.active]:text-accent-foreground"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={isAdmin ? "/admin" : "/auth"}
              className="ml-2 rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground"
            >
              {isAdmin ? "Painel" : "Entrar"}
            </Link>
          </nav>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="ml-auto rounded-md p-2 hover:bg-primary-foreground/10 lg:hidden"
            aria-label="Abrir menu"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>

        {open && (
          <nav className="border-t border-primary-foreground/10 px-4 pb-3 lg:hidden">
            {NAV.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-2 text-sm font-medium hover:bg-primary-foreground/10"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to={isAdmin ? "/admin" : "/auth"}
              onClick={() => setOpen(false)}
              className="mt-2 block rounded-md bg-accent px-3 py-2 text-sm font-semibold text-accent-foreground"
            >
              {isAdmin ? "Painel de administração" : "Entrar"}
            </Link>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-16 border-t border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-8 text-sm text-muted-foreground">
          <p className="font-semibold text-foreground">Campeonato Recreativo de Chalucuane</p>
          <p className="mt-1">Resultados, classificação e notícias do nosso campeonato.</p>
          <p className="mt-4 text-xs">
            © {new Date().getFullYear()} Campeonato Recreativo de Chalucuane
          </p>
        </div>
      </footer>
    </div>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="border-b border-border bg-secondary/40">
      <div className="mx-auto w-full max-w-6xl px-4 py-8">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
    </div>
  );
}
