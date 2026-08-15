import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MediaImage } from "@/components/MediaImage";
import { UploadField } from "@/components/UploadField";
import { uploadMedia } from "@/lib/media";
import { formatDate, postsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/publicacoes")({
  head: () => ({
    meta: [
      { title: "Publicações | Administração" },
      { name: "description", content: "Publicar notícias com fotos do campeonato." },
      { property: "og:title", content: "Gestão de publicações" },
      { property: "og:description", content: "Notícias e galerias de fotos." },
    ],
  }),
  component: AdminPosts,
});

function AdminPosts() {
  const qc = useQueryClient();
  const { data: posts } = useQuery(postsQuery);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState<string | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [published, setPublished] = useState(true);
  const [busy, setBusy] = useState(false);

  const refresh = () => void qc.invalidateQueries({ queryKey: ["posts"] });

  async function addImages(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    try {
      const paths = await Promise.all(Array.from(files).map((f) => uploadMedia(f, "posts")));
      setImages((prev) => [...prev, ...paths]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no upload");
    } finally {
      setBusy(false);
    }
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("posts").insert({
      title,
      excerpt: excerpt || null,
      content: content || null,
      cover_url: cover,
      images,
      published,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Publicação criada");
    setTitle("");
    setExcerpt("");
    setContent("");
    setCover(null);
    setImages([]);
    refresh();
  }

  async function togglePublished(id: string, value: boolean) {
    const { error } = await supabase.from("posts").update({ published: value }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    refresh();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Publicação removida");
    refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[380px_1fr]">
      <section className="card-elevated h-fit p-5">
        <h2 className="text-xl">Nova publicação</h2>
        <form className="mt-4 space-y-3" onSubmit={create}>
          <input
            required
            placeholder="Título"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="field-input"
          />
          <input
            placeholder="Resumo"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="field-input"
          />
          <textarea
            rows={6}
            placeholder="Texto da notícia"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="field-input"
          />
          <UploadField label="Foto de capa" folder="posts" value={cover} onChange={setCover} />
          <div>
            <span className="text-sm font-medium">Galeria de fotos</span>
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={busy}
              onChange={(e) => void addImages(e.target.files)}
              className="mt-1 block text-xs"
            />
            {images.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {images.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((x) => x !== p))}
                    title="Remover foto"
                  >
                    <MediaImage path={p} alt="Foto" className="size-14 rounded-md" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Publicar imediatamente
          </label>
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Publicar
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {(posts ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Sem publicações.</p>
        )}
        {(posts ?? []).map((p) => (
          <div key={p.id} className="card-elevated flex items-center gap-3 p-3">
            <MediaImage path={p.cover_url} alt={p.title} className="size-16 rounded-md" />
            <div className="flex-1">
              <p className="font-semibold">{p.title}</p>
              <p className="text-xs text-muted-foreground">{formatDate(p.created_at)}</p>
            </div>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={p.published}
                onChange={(e) => void togglePublished(p.id, e.target.checked)}
              />
              {p.published ? "Publicada" : "Rascunho"}
            </label>
            <button
              type="button"
              onClick={() => {
                if (confirm("Remover publicação?")) void remove(p.id);
              }}
              className="rounded-md p-2 text-destructive hover:bg-destructive/10"
              aria-label="Remover publicação"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
