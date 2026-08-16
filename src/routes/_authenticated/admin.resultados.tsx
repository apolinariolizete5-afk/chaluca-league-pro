import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  formatDateTime,
  isPlayed,
  matchesQuery,
  playersQuery,
  teamName,
  teamsQuery,
  type Match,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/resultados")({
  head: () => ({
    meta: [
      { title: "Resultados | Administração" },
      { name: "description", content: "Registar resultados e atualizar a classificação." },
      { property: "og:title", content: "Gestão de resultados" },
      { property: "og:description", content: "Resultados, golos e disciplina." },
    ],
  }),
  component: AdminResults,
});

function AdminResults() {
  const { data: matches } = useQuery(matchesQuery);
  const { data: teams } = useQuery(teamsQuery);

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ao guardar um resultado, a classificação e as estatísticas são atualizadas
        automaticamente.
      </p>
      {(matches ?? []).length === 0 && (
        <p className="text-sm text-muted-foreground">Sem jogos no calendário.</p>
      )}
      {(matches ?? []).map((m) => (
        <ResultCard key={m.id} match={m} label={`${teamName(teams, m.home_team_id)} vs ${teamName(teams, m.away_team_id)}`} />
      ))}
    </div>
  );
}

function ResultCard({ match, label }: { match: Match; label: string }) {
  const qc = useQueryClient();
  const { data: players } = useQuery(playersQuery);
  const [home, setHome] = useState(match.home_score?.toString() ?? "");
  const [away, setAway] = useState(match.away_score?.toString() ?? "");
  const [scorer, setScorer] = useState("");
  const [eventType, setEventType] = useState<"goal" | "assist" | "yellow" | "red">("goal");
  const [minute, setMinute] = useState("");
  const [busy, setBusy] = useState(false);

  const squad = (players ?? []).filter(
    (p) => p.team_id === match.home_team_id || p.team_id === match.away_team_id,
  );

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["matches"] });
    void qc.invalidateQueries({ queryKey: ["standings"] });
    void qc.invalidateQueries({ queryKey: ["scorers"] });
  };

  async function save() {
    setBusy(true);
    const { error } = await supabase
      .from("matches")
      .update({
        home_score: home === "" ? null : Number(home),
        away_score: away === "" ? null : Number(away),
      })
      .eq("id", match.id);
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Resultado guardado — classificação atualizada");
    refresh();
  }

  async function clearResult() {
    const { error } = await supabase
      .from("matches")
      .update({ home_score: null, away_score: null })
      .eq("id", match.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setHome("");
    setAway("");
    toast.success("Resultado removido");
    refresh();
  }

  async function syncScoreFromGoals() {
    const { data } = await supabase
      .from("match_events")
      .select("team_id,type")
      .eq("match_id", match.id)
      .eq("type", "goal");
    const h = (data ?? []).filter((e) => e.team_id === match.home_team_id).length;
    const a = (data ?? []).filter((e) => e.team_id === match.away_team_id).length;
    await supabase.from("matches").update({ home_score: h, away_score: a }).eq("id", match.id);
    setHome(String(h));
    setAway(String(a));
  }

  async function addEvent() {
    const player = squad.find((p) => p.id === scorer);
    if (!player) {
      toast.error("Escolha um jogador");
      return;
    }
    const { error } = await supabase.from("match_events").insert({
      match_id: match.id,
      player_id: player.id,
      team_id: player.team_id,
      type: eventType,
      minute: minute ? Number(minute) : null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setScorer("");
    setMinute("");
    if (eventType === "goal") await syncScoreFromGoals();
    toast.success("Lance registado");
    void qc.invalidateQueries({ queryKey: ["events", match.id] });
    refresh();
  }

  async function removeEvent(id: string, type: string) {
    const { error } = await supabase.from("match_events").delete().eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (type === "goal") await syncScoreFromGoals();
    toast.success("Lance removido");
    void qc.invalidateQueries({ queryKey: ["events", match.id] });
    refresh();
  }

  return (
    <div className="card-elevated p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1">
          <p className="font-semibold">{label}</p>
          <p className="text-xs text-muted-foreground">{formatDateTime(match.kickoff)}</p>
        </div>
        <input
          type="number"
          min={0}
          value={home}
          onChange={(e) => setHome(e.target.value)}
          className="field-input w-16 text-center"
          aria-label="Golos casa"
        />
        <span className="font-bold">-</span>
        <input
          type="number"
          min={0}
          value={away}
          onChange={(e) => setAway(e.target.value)}
          className="field-input w-16 text-center"
          aria-label="Golos fora"
        />
        <button
          type="button"
          disabled={busy}
          onClick={() => void save()}
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          Guardar
        </button>
        {isPlayed(match) && (
          <button
            type="button"
            onClick={() => void clearResult()}
            className="rounded-md border border-border px-3 py-2 text-sm font-semibold text-destructive"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_150px_90px_auto]">
        <select value={scorer} onChange={(e) => setScorer(e.target.value)} className="field-input">
          <option value="">Jogador</option>
          {squad.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value as typeof eventType)}
          className="field-input"
        >
          <option value="goal">Golo</option>
          <option value="assist">Assistência</option>
          <option value="yellow">Cartão amarelo</option>
          <option value="red">Cartão vermelho</option>
        </select>
        <input
          type="number"
          placeholder="Min."
          value={minute}
          onChange={(e) => setMinute(e.target.value)}
          className="field-input"
        />
        <button
          type="button"
          onClick={() => void addEvent()}
          className="rounded-md border border-border px-4 py-2 text-sm font-semibold"
        >
          Registar
        </button>
      </div>

      {(events ?? []).length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {(events ?? []).map((e) => (
            <li key={e.id} className="flex items-center gap-2">
              <span className="flex-1">
                {EVENT_LABEL[e.type] ?? e.type} — {playerName(e.player_id)}
                {e.minute != null ? ` (${e.minute}')` : ""}
              </span>
              <button
                type="button"
                onClick={() => void removeEvent(e.id, e.type)}
                className="text-xs font-semibold text-destructive"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
