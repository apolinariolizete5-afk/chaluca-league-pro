import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout, PageHeader } from "@/components/layout/SiteLayout";
import { MediaImage } from "@/components/MediaImage";
import { postsQuery, formatDate } from "@/lib/queries";

export const Route = createFileRoute("/noticias/")({
  head: () => ({
    meta: [
      { title: "Notícias | Campeonato Recreativo de Chalucuane" },
      { name: "description", content: "Últimas notícias e publicações do campeonato." },
      { property: "og:title", content: "Notícias do campeonato" },
      { property: "og:description", content: "Publicações, fotos e novidades das equipas." },
    ],
  }),
  component: Noticias,
});

function Noticias() {
  const { data: posts } = useQuery(postsQuery);
  const news = (posts ?? []).filter((p) => p.published);

  return (
    <SiteLayout>
      <PageHeader title="Notícias" subtitle="Novidades do campeonato" />
      <div className="mx-auto grid w-full max-w-6xl gap-5 px-4 py-10 sm:grid-cols-2 lg:grid-cols-3">
        {news.length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não há publicações.</p>
        )}
        {news.map((p) => (
          <Link
            key={p.id}
            to="/noticias/$id"
            params={{ id: p.id }}
            className="overflow-hidden rounded-lg border border-border bg-card"
          >
            <MediaImage path={p.cover_url} alt={p.title} className="h-44 w-full" />
            <div className="p-4">
              <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
              <h2 className="mt-1 font-bold">{p.title}</h2>
              {p.excerpt && (
                <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{p.excerpt}</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </SiteLayout>
  );
}
