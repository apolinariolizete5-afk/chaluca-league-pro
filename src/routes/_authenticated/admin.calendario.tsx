import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime, isPlayed, matchesQuery, teamName, teamsQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/calendario")({
  head: () => ({
    meta: [
      { title: "Calendário | Administração" },
      { name: "description", content: "Marcar e remover jogos do campeonato." },
      { property: "og:title", content: "Gestão do calendário" },
      { property: "og:description", content: "Marcar e remover jogos." },
    ],
  }),
  component: AdminCalendar,
});

function AdminCalendar() {
  const qc = useQueryClient();
  const { data: teams } = useQuery(teamsQuery);
  const { data: matches } = useQuery(matchesQuery);
  const [home, setHome] = useState("");
  const [away, setAway] = useState("");
  const [kickoff, setKickoff] = useState("");
  const [venue, setVenue] = useState("");
  const [round, setRound] = useState("");

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["matches"] });
    void qc.invalidateQueries({ queryKey: ["standings"] });
  };

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (home === away) {
      toast.error("Escolha equipas diferentes");
      return;
    }
    const { error } = await supabase.from("matches").insert({
      home_team_id: home,
      away_team_id: away,
      kickoff: new Date(kickoff).toISOString(),
      venue: venue || null,
      round: round ? Number(round) : null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Jogo marcado");
    setKickoff("");
    setVenue("");
    setRound("");
    refresh();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("matches").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Jogo removido");
    refresh();
  }

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    const ids = (teams ?? []).map((t) => t.id);
    if (ids.length < 2) {
      toast.error("Precisa de pelo menos 2 equipas");
      return;
    }
    const rows = generateRoundRobin(ids, new Date(genStart).toISOString(), Number(genGap) || 7, genVenue || null);
    if (!rows.length) return;
    if (!confirm(`Criar ${rows.length} jogos em ${ids.length - (ids.length % 2 === 1 ? 0 : 1)} jornadas?`))
      return;
    setBusy(true);
    const { error } = await supabase.from("matches").insert(rows);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(`${rows.length} jogos criados`);
    refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[340px_1fr]">
      <div className="space-y-6">
      <section className="card-elevated h-fit p-5">
        <h2 className="text-xl">Marcar jogo</h2>
        <form className="mt-4 space-y-3" onSubmit={create}>
          <select
            required
            value={home}
            onChange={(e) => setHome(e.target.value)}
            className="field-input"
          >
            <option value="">Equipa da casa</option>
            {(teams ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <select
            required
            value={away}
            onChange={(e) => setAway(e.target.value)}
            className="field-input"
          >
            <option value="">Equipa visitante</option>
            {(teams ?? []).map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <input
            required
            type="datetime-local"
            value={kickoff}
            onChange={(e) => setKickoff(e.target.value)}
            className="field-input"
          />
          <input
            placeholder="Local"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            className="field-input"
          />
          <input
            type="number"
            placeholder="Jornada"
            value={round}
            onChange={(e) => setRound(e.target.value)}
            className="field-input"
          />
          <button
            type="submit"
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            Marcar jogo
          </button>
        </form>
      </section>

      <section className="card-elevated h-fit p-5">
        <h2 className="text-xl">Gerar todas as jornadas</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Cria automaticamente todos contra todos, uma jornada de cada vez.
        </p>
        <form className="mt-4 space-y-3" onSubmit={generate}>
          <input
            required
            type="datetime-local"
            value={genStart}
            onChange={(e) => setGenStart(e.target.value)}
            className="field-input"
          />
          <input
            type="number"
            min={1}
            placeholder="Dias entre jornadas"
            value={genGap}
            onChange={(e) => setGenGap(e.target.value)}
            className="field-input"
          />
          <input
            placeholder="Local (opcional)"
            value={genVenue}
            onChange={(e) => setGenVenue(e.target.value)}
            className="field-input"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-md border border-primary px-4 py-2.5 text-sm font-semibold text-primary disabled:opacity-60"
          >
            {busy ? "A gerar…" : "Gerar calendário completo"}
          </button>
        </form>
      </section>
      </div>


      <section className="space-y-3">
        {(matches ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Sem jogos marcados.</p>
        )}
        {(matches ?? []).map((m) => (
          <div key={m.id} className="card-elevated flex items-center gap-3 p-4">
            <div className="flex-1">
              <p className="font-semibold">
                {teamName(teams, m.home_team_id)} vs {teamName(teams, m.away_team_id)}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatDateTime(m.kickoff)}
                {m.venue ? ` · ${m.venue}` : ""}
                {m.round ? ` · Jornada ${m.round}` : ""}
              </p>
            </div>
            <span
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                isPlayed(m) ? "bg-primary text-primary-foreground" : "bg-secondary"
              }`}
            >
              {isPlayed(m) ? `${m.home_score}-${m.away_score}` : "Por jogar"}
            </span>
            <button
              type="button"
              onClick={() => {
                if (confirm("Remover este jogo?")) void remove(m.id);
              }}
              className="rounded-md p-2 text-destructive hover:bg-destructive/10"
              aria-label="Remover jogo"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </section>
    </div>
  );
}
