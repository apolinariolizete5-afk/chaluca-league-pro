import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Copy, Mail, Send, Trash2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/queries";
import { useSession } from "@/hooks/use-auth";
import { listAdmins, inviteAdmin, resendInvite, revokeAdmin } from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin/administradores")({
  head: () => ({
    meta: [
      { title: "Administradores | Administração" },
      { name: "description", content: "Convidar e gerir administradores do campeonato." },
      { property: "og:title", content: "Gestão de administradores" },
      { property: "og:description", content: "Convites por email e lista de administradores." },
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
  const { user } = useSession();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const invite = useServerFn(inviteAdmin);
  const resend = useServerFn(resendInvite);
  const remove = useServerFn(revokeAdmin);
  const admins = useServerFn(listAdmins);

  const { data: adminList } = useQuery({
    queryKey: ["admins"],
    queryFn: () => admins(),
  });

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

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["admin-invites"] });
    void qc.invalidateQueries({ queryKey: ["admins"] });
  };

  function report(res: { link: string; emailed: boolean }) {
    void navigator.clipboard.writeText(res.link).catch(() => null);
    toast.success(
      res.emailed
        ? "Convite enviado por email (link também copiado)"
        : "Convite criado — email não enviado, link copiado",
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await invite({ data: { email, origin: window.location.origin } });
      setEmail("");
      report(res);
      refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha ao convidar");
    } finally {
      setBusy(false);
    }
  }

  async function revokeInvite(id: string) {
    if (!window.confirm("Remover este convite?")) return;
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
          O convidado recebe um email com o link, cria a conta e escolhe a sua própria
          palavra-passe.
        </p>
        <form className="mt-4 space-y-3" onSubmit={submit}>
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
            disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <Send className="size-4" />
            {busy ? "A enviar…" : "Enviar convite"}
          </button>
        </form>
      </section>

      <div className="space-y-8">
        <section>
          <h2 className="text-xl">Administradores</h2>
          <div className="mt-3 space-y-3">
            {(adminList ?? []).map((a) => (
              <div key={a.user_id} className="card-elevated flex flex-wrap items-center gap-3 p-4">
                <ShieldCheck className="size-5 text-primary" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{a.email ?? a.user_id}</p>
                  <p className="text-xs text-muted-foreground">
                    Administrador desde {formatDate(a.created_at)}
                    {a.user_id === user?.id ? " · você" : ""}
                  </p>
                </div>
                {a.user_id !== user?.id && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!window.confirm(`Remover acesso de ${a.email ?? "este utilizador"}?`))
                        return;
                      try {
                        await remove({ data: { userId: a.user_id } });
                        toast.success("Acesso removido");
                        refresh();
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : "Falha ao remover");
                      }
                    }}
                    className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                    aria-label="Remover acesso"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            ))}
            {(adminList ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Sem administradores listados.</p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xl">Convites</h2>
          <div className="mt-3 space-y-3">
            {(invites ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground">Sem convites.</p>
            )}
            {(invites ?? []).map((i) => {
              const link = `${typeof window !== "undefined" ? window.location.origin : ""}/convite/${i.token}`;
              const expired = new Date(i.expires_at) < new Date();
              const state = i.used_at ? "Utilizado" : expired ? "Expirado" : "Pendente";
              return (
                <div key={i.id} className="card-elevated flex flex-wrap items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{i.email}</p>
                    <p className="truncate text-xs text-muted-foreground">{link}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Criado a {formatDate(i.created_at)} · {state}
                    </p>
                  </div>
                  {!i.used_at && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          const res = await resend({
                            data: { id: i.id, origin: window.location.origin },
                          });
                          report(res);
                          refresh();
                        } catch (err) {
                          toast.error(err instanceof Error ? err.message : "Falha ao reenviar");
                        }
                      }}
                      className="rounded-md border border-border p-2"
                      aria-label="Reenviar email"
                    >
                      <Mail className="size-4" />
                    </button>
                  )}
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
                    onClick={() => void revokeInvite(i.id)}
                    className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                    aria-label="Remover convite"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
