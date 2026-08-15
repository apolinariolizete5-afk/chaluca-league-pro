import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { MediaImage } from "@/components/MediaImage";
import { UploadField } from "@/components/UploadField";
import { playersQuery, teamsQuery, type Team } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/admin/equipas")({
  head: () => ({
    meta: [
      { title: "Equipas | Administração" },
      { name: "description", content: "Adicionar e remover equipas e jogadores." },
      { property: "og:title", content: "Gestão de equipas" },
      { property: "og:description", content: "Equipas e jogadores do campeonato." },
    ],
  }),
  component: AdminTeams,
});

function AdminTeams() {
  const qc = useQueryClient();
  const { data: teams } = useQuery(teamsQuery);
  const { data: players } = useQuery(playersQuery);
  const [name, setName] = useState("");
  const [shortName, setShortName] = useState("");
  const [logo, setLogo] = useState<string | null>(null);
  const [openTeam, setOpenTeam] = useState<string | null>(null);

  const refresh = () => {
    void qc.invalidateQueries({ queryKey: ["teams"] });
    void qc.invalidateQueries({ queryKey: ["players"] });
    void qc.invalidateQueries({ queryKey: ["standings"] });
  };

  const addTeam = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("teams")
        .insert({ name, short_name: shortName || null, logo_url: logo });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Equipa adicionada");
      setName("");
      setShortName("");
      setLogo(null);
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const removeTeam = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Equipa removida");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
      <section className="card-elevated h-fit p-5">
        <h2 className="text-xl">Nova equipa</h2>
        <form
          className="mt-4 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            addTeam.mutate();
          }}
        >
          <div>
            <label className="text-sm font-medium" htmlFor="tname">
              Nome
            </label>
            <input
              id="tname"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="field-input mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium" htmlFor="tshort">
              Sigla
            </label>
            <input
              id="tshort"
              value={shortName}
              onChange={(e) => setShortName(e.target.value)}
              className="field-input mt-1"
            />
          </div>
          <UploadField label="Logótipo" folder="teams" value={logo} onChange={setLogo} />
          <button
            type="submit"
            disabled={addTeam.isPending}
            className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            Adicionar equipa
          </button>
        </form>
      </section>

      <section className="space-y-4">
        {(teams ?? []).length === 0 && (
          <p className="text-sm text-muted-foreground">Ainda não há equipas.</p>
        )}
        {(teams ?? []).map((team) => (
          <div key={team.id} className="card-elevated overflow-hidden">
            <div className="flex items-center gap-3 p-4">
              <MediaImage path={team.logo_url} alt={team.name} className="size-11 rounded-full" />
              <div className="flex-1">
                <p className="font-semibold">{team.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(players ?? []).filter((p) => p.team_id === team.id).length} jogadores
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpenTeam(openTeam === team.id ? null : team.id)}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold"
              >
                {openTeam === team.id ? "Fechar" : "Jogadores"}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Remover ${team.name}?`)) removeTeam.mutate(team.id);
                }}
                className="rounded-md p-2 text-destructive hover:bg-destructive/10"
                aria-label="Remover equipa"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            {openTeam === team.id && <PlayersPanel team={team} onChange={refresh} />}
          </div>
        ))}
      </section>
    </div>
  );
}

function PlayersPanel({ team, onChange }: { team: Team; onChange: () => void }) {
  const { data: players } = useQuery(playersQuery);
  const list = (players ?? []).filter((p) => p.team_id === team.id);
  const [name, setName] = useState("");
  const [shirt, setShirt] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [registered, setRegistered] = useState(true);

  async function addPlayer(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.from("players").insert({
      team_id: team.id,
      name,
      shirt_number: shirt ? Number(shirt) : null,
      photo_url: photo,
      registered,
    });
    if (error) return toast.error(error.message);
    toast.success("Jogador adicionado");
    setName("");
    setShirt("");
    setPhoto(null);
    setRegistered(true);
    onChange();
  }

  async function toggle(id: string, value: boolean) {
    const { error } = await supabase.from("players").update({ registered: value }).eq("id", id);
    if (error) return toast.error(error.message);
    onChange();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Jogador removido");
    onChange();
  }

  return (
    <div className="border-t border-border bg-secondary/40 p-4">
      <form className="grid gap-3 sm:grid-cols-[1fr_90px_auto]" onSubmit={addPlayer}>
        <input
          required
          placeholder="Nome do jogador"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="field-input"
        />
        <input
          type="number"
          placeholder="Dorsal"
          value={shirt}
          onChange={(e) => setShirt(e.target.value)}
          className="field-input"
        />
        <button
          type="submit"
          className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Adicionar
        </button>
        <div className="sm:col-span-3">
          <UploadField label="Foto do jogador" folder="players" value={photo} onChange={setPhoto} />
        </div>
        <label className="flex items-center gap-2 text-sm sm:col-span-3">
          <input
            type="checkbox"
            checked={registered}
            onChange={(e) => setRegistered(e.target.checked)}
          />
          Inscrito
        </label>
      </form>

      <ul className="mt-4 space-y-2">
        {list.length === 0 && <li className="text-sm text-muted-foreground">Sem jogadores.</li>}
        {list.map((p) => (
          <li key={p.id} className="flex items-center gap-3 rounded-md bg-card p-2">
            <MediaImage path={p.photo_url} alt={p.name} className="size-9 rounded-full" />
            <span className="w-8 text-center font-display text-lg text-primary">
              {p.shirt_number ?? "–"}
            </span>
            <span className="flex-1 text-sm font-medium">{p.name}</span>
            <label className="flex items-center gap-1 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={p.registered}
                onChange={(e) => void toggle(p.id, e.target.checked)}
              />
              {p.registered ? "Inscrito" : "Não inscrito"}
            </label>
            <button
              type="button"
              onClick={() => void remove(p.id)}
              className="rounded-md p-2 text-destructive hover:bg-destructive/10"
              aria-label="Remover jogador"
            >
              <Trash2 className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
