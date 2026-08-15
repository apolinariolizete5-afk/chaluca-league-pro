import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Copy, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/administradores")({
  head: () => ({
    meta: [
      { title: "Administradores | Administração" },
      { name: "description", content: "Convidar novos administradores do campeonato." },
      { property: "og:title", content: "Gestão de administradores" },
      { property: "og:description", content: "Convites de acesso ao painel." },
    ],
  }),
  component: AdminInvites,
});

type Invite = {
  id: string;
  email: string;
  token: string;
  created_at: string;
  expires_at: string;
  used_at: string | null;
};

function AdminInvites() {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const { data: invites } = useQuery({
    queryKey: ["admin-invites"],
    queryFn: async (): Promise<Invite[]> => {
      const { data, error } = await supabase
        .from("admin_invites")
        .select("id,email,token,created_at,expires_at,used_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const refresh = () => void qc.invalidateQueries({ queryKey: ["admin-invites"] });

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    const { data: userData } = await supabase.auth.getUser();
    const token = crypto.randomUUID().replace(/-/g, "");
    const { error } = await supabase
      .from("admin_invites")
      .insert({ email, token, invited_by: userData.user?.id ?? null });
    if (error) {
      toast.error(error.message);
      return;
    }
    setEmail("");
    await navigator.clipboard
      .writeText(`${window.location.origin}/convite/${token}`)
      .catch(() => null);
    toast.success("Convite criado e link copiado");
    refresh();
  }

  async function revoke(id: string) {
    const { error } = await supabase.from("admin_invites").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Convite removido");
    refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
      <section className="card-elevated h-fit p-5">
        <h2 className="text-xl">Convidar administrador</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          O convidado abre o link, cria a conta e escolhe a sua própria palavra-passe.
        </p>
        <form className="mt-4 space-y-3" onSubmit={invite}>
          <input
            required
            type="email"
            placeholder="Email do convidado"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="field-input"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Gerar convite
          </button>
        </form>
      </section>

      <section className="space-y-3">
        {(invites ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Sem convites.</p>
        )}
        {(invites ?? []).map((i) => {
          const link = `${typeof window !== "undefined" ? window.location.origin : ""}/convite/${i.token}`;
          const expired = new Date(i.expires_at) < new Date();
          return (
            <div key={i.id} className="card-elevated flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{i.email}</p>
                <p className="truncate text-xs text-muted-foreground">{link}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Criado a {formatDate(i.created_at)} ·{" "}
                  {i.used_at ? "Utilizado" : expired ? "Expirado" : "Pendente"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  void navigator.clipboard.writeText(link);
                  toast.success("Link copiado");
                }}
                className="rounded-md border border-border p-2"
                aria-label="Copiar link"
              >
                <Copy className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => void revoke(i.id)}
                className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                aria-label="Remover convite"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          );
        })}
      </section>
    </div>
  );
}
