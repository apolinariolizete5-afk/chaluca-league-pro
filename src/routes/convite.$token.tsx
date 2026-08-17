import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SiteLayout } from "@/components/layout/SiteLayout";

export const Route = createFileRoute("/convite/$token")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Convite de administrador | Campeonato de Chalucuane" },
      { name: "description", content: "Aceite o convite e crie a sua palavra-passe de acesso." },
      { property: "og:title", content: "Convite de administrador" },
      { property: "og:description", content: "Crie a sua conta de administração do campeonato." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: InvitePage,
});

function InvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    void supabase.rpc("invite_email", { _token: token }).then(({ data, error }) => {
      if (error || !data) {
        setInvalid(true);
        return;
      }
      setEmail(data);
    });
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("A palavra-passe deve ter pelo menos 8 caracteres");
      return;
    }
    if (password !== confirm) {
      toast.error("As palavras-passe não coincidem");
      return;
    }
    setBusy(true);
    const { data: current } = await supabase.auth.getSession();
    let error: { message: string } | null = null;
    if (current.session) {
      // O convidado chegou já autenticado pelo link do email: só define a palavra-passe.
      ({ error } = await supabase.auth.updateUser({ password }));
    } else {
      ({ error } = await supabase.auth.signUp({ email, password }));
      if (error && /already/i.test(error.message)) {
        ({ error } = await supabase.auth.signInWithPassword({ email, password }));
      }
    }
    if (error) {
      setBusy(false);
      toast.error(error.message);
      return;
    }
    const { data: ok, error: rpcError } = await supabase.rpc("accept_admin_invite", {
      _token: token,
    });
    setBusy(false);
    if (rpcError || !ok) {
      toast.error(rpcError?.message ?? "Convite inválido ou expirado");
      return;
    }
    toast.success("Conta de administrador criada");
    void navigate({ to: "/admin" });
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <h1 className="text-3xl">Convite de administrador</h1>
        {invalid ? (
          <p className="mt-4 text-sm text-muted-foreground">
            Este convite é inválido, já foi utilizado ou expirou. Peça um novo link a um
            administrador.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-muted-foreground">
              Crie a sua palavra-passe para aceder ao painel do campeonato.
            </p>
            <form className="card-elevated mt-6 space-y-3 p-5" onSubmit={submit}>
              <input
                readOnly
                value={email}
                className="field-input bg-secondary"
                aria-label="Email do convite"
              />
              <input
                required
                type="password"
                placeholder="Nova palavra-passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="field-input"
              />
              <input
                required
                type="password"
                placeholder="Confirmar palavra-passe"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="field-input"
              />
              <button
                type="submit"
                disabled={busy || !email}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {busy ? "A criar conta…" : "Aceitar convite"}
              </button>
            </form>
          </>
        )}
      </div>
    </SiteLayout>
  );
}
