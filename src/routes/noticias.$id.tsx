import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { MediaImage } from "@/components/MediaImage";
import { postsQuery, formatDate } from "@/lib/queries";

export const Route = createFileRoute("/noticias/$id")({
  head: () => ({
    meta: [
      { title: "Notícia | Campeonato Recreativo de Chalucuane" },
      { name: "description", content: "Publicação do Campeonato Recreativo de Chalucuane." },
      { property: "og:title", content: "Notícia do campeonato" },
      { property: "og:description", content: "Leia a publicação completa com fotos." },
    ],
  }),
  component: NoticiaDetalhe,
});

function NoticiaDetalhe() {
  const { id } = Route.useParams();
  const { data: posts, isLoading } = useQuery(postsQuery);
  const post = (posts ?? []).find((p) => p.id === id && p.published);

  return (
    <SiteLayout>
      <article className="mx-auto w-full max-w-3xl px-4 py-10">
        <Link to="/noticias" className="text-sm text-muted-foreground hover:underline">
          ← Voltar às notícias
        </Link>
        {isLoading && <p className="mt-6 text-sm text-muted-foreground">A carregar…</p>}
        {!isLoading && !post && (
          <p className="mt-6 text-sm text-muted-foreground">Publicação não encontrada.</p>
        )}
        {post && (
          <>
            <h1 className="mt-4 text-2xl font-extrabold sm:text-3xl">{post.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">{formatDate(post.created_at)}</p>
            {post.cover_url && (
              <MediaImage
                path={post.cover_url}
                alt={post.title}
                className="mt-6 h-64 w-full rounded-lg"
              />
            )}
            {post.content && (
              <div className="mt-6 space-y-4 text-sm leading-relaxed whitespace-pre-line">
                {post.content}
              </div>
            )}
            {post.images?.length > 0 && (
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {post.images.map((img) => (
                  <MediaImage
                    key={img}
                    path={img}
                    alt={post.title}
                    className="h-44 w-full rounded-lg"
                  />
                ))}
              </div>
            )}
          </>
        )}
      </article>
    </SiteLayout>
  );
}
