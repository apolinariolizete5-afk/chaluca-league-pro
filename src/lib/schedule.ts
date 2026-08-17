export type GeneratedMatch = {
  home_team_id: string;
  away_team_id: string;
  round: number;
  kickoff: string;
  venue: string | null;
};

/**
 * Round-robin (todos contra todos) usando o método do círculo.
 * Gera uma jornada por semana (ou intervalo escolhido) a partir da data inicial.
 */
export function generateRoundRobin(
  teamIds: string[],
  startISO: string,
  intervalDays: number,
  venue: string | null,
): GeneratedMatch[] {
  const ids = [...teamIds];
  if (ids.length < 2) return [];
  const bye = ids.length % 2 === 1;
  if (bye) ids.push("__bye__");

  const rounds = ids.length - 1;
  const half = ids.length / 2;
  const start = new Date(startISO);
  const out: GeneratedMatch[] = [];
  let list = ids.slice(1);

  for (let r = 0; r < rounds; r++) {
    const day = new Date(start.getTime() + r * intervalDays * 86400000);
    const pairs: [string, string][] = [[ids[0]!, list[list.length - 1]!]];
    for (let i = 0; i < half - 1; i++) {
      pairs.push([list[i]!, list[list.length - 2 - i]!]);
    }
    pairs.forEach(([a, b], index) => {
      if (a === "__bye__" || b === "__bye__") return;
      const kickoff = new Date(day.getTime() + index * 2 * 3600000);
      const swap = r % 2 === 1;
      out.push({
        home_team_id: swap ? b : a,
        away_team_id: swap ? a : b,
        round: r + 1,
        kickoff: kickoff.toISOString(),
        venue,
      });
    });
    list = [list[list.length - 1]!, ...list.slice(0, -1)];
  }

  return out;
}
