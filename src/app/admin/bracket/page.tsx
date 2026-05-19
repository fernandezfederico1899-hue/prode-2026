import { asc, eq } from "drizzle-orm";
import { Trophy } from "lucide-react";
import { db } from "@/db";
import { matches, teams } from "@/db/schema";
import {
  getGroupStandings,
  getBestThirdPlaceRanking,
} from "@/server/queries/standings";
import { BracketResolver } from "@/components/admin/bracket-resolver";
import { KoSlotAssigner } from "@/components/admin/ko-slot-assigner";
import { formatSlot, matchShortLabel } from "@/lib/bracket-format";

const KICKOFF_FMT = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function AdminBracketPage() {
  const [standings, thirdRanking, koMatches, allTeams] = await Promise.all([
    getGroupStandings(),
    getBestThirdPlaceRanking(),
    db
      .select()
      .from(matches)
      .where(eq(matches.stage, "round_of_32"))
      .orderBy(asc(matches.kickoffAt)),
    db.select().from(teams).orderBy(asc(teams.name)),
  ]);

  // Cuántos grupos están completos (4 teams × 3 partidos)
  const groupLetters = Object.keys(standings).sort();
  const groupsFinished =
    groupLetters.length === 12 &&
    Object.values(standings).every((g) => g.every((s) => s.played === 3));
  const groupsCompletedCount = Object.values(standings).filter((g) =>
    g.every((s) => s.played === 3),
  ).length;

  const top8Thirds = thirdRanking.slice(0, 8);
  const top8ThirdsIds = new Set(top8Thirds.map((t) => t.team.id));

  // Para los dropdowns: candidatos = top 8 terceros (los que clasifican).
  const candidatesForThirds = top8Thirds.map((t) => t.team);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-8">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">BRACKET</h1>
        <p className="text-muted-foreground mt-1">
          Resolución de 16avos al cierre de la fase de grupos.
        </p>
      </header>

      <section className="rounded-xl border-2 border-border bg-card p-5 md:p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Grupos terminados" value={`${groupsCompletedCount}/12`} highlight={!groupsFinished} />
          <Stat label="Mejores 3ros (top 8)" value={top8Thirds.length} />
          <Stat
            label="Slots R32 asignados"
            value={`${
              koMatches.filter((m) => m.homeTeamId).length +
              koMatches.filter((m) => m.awayTeamId).length
            }/32`}
          />
          <Stat label="Matches R32" value={koMatches.length} />
        </div>
        <BracketResolver groupsFinished={groupsFinished} />
      </section>

      {groupsCompletedCount > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-4">TABLA DE 3ROS</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Los primeros 8 clasifican a 16avos. Empate desempata por dif. gol →
            goles a favor → nombre.
          </p>
          <div className="grid gap-1.5">
            {thirdRanking.map((s, i) => (
              <div
                key={s.team.id}
                className={`flex items-center gap-3 p-2.5 rounded-md border ${
                  i < 8
                    ? "border-primary/40 bg-primary/5"
                    : "border-border bg-card opacity-60"
                }`}
              >
                <span className="font-display text-xl tabular-nums w-7 text-center">
                  {i + 1}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://flagcdn.com/${s.team.flagCode}.svg`}
                  alt=""
                  className="w-7 h-5 rounded-sm border border-border object-cover"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold truncate">{s.team.name}</div>
                  <div className="text-xs text-muted-foreground">
                    Grupo {s.team.groupLetter} · {s.points} pts ·{" "}
                    {s.goalsFor - s.goalsAgainst > 0 ? "+" : ""}
                    {s.goalsFor - s.goalsAgainst} GD · {s.goalsFor} GF
                  </div>
                </div>
                {i < 8 && (
                  <Trophy className="w-4 h-4 text-primary shrink-0" />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display text-2xl mb-4">16AVOS DE FINAL</h2>
        <div className="grid gap-3">
          {koMatches.map((m) => {
            const homeTeam = allTeams.find((t) => t.id === m.homeTeamId);
            const awayTeam = allTeams.find((t) => t.id === m.awayTeamId);
            const homeIsThird = m.homeSlot?.startsWith("3");
            const awayIsThird = m.awaySlot?.startsWith("3");
            return (
              <div
                key={m.id}
                className="rounded-md border border-border bg-card p-3 md:p-4 space-y-3"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-primary">
                    {matchShortLabel(m.stage, m.matchNum)}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {KICKOFF_FMT.format(m.kickoffAt)} · {m.venue}
                  </span>
                </div>
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                      {formatSlot(m.homeSlot)}
                    </div>
                    {homeIsThird ? (
                      <KoSlotAssigner
                        matchId={m.id}
                        side="home"
                        currentTeamId={m.homeTeamId ?? null}
                        slotLabel={formatSlot(m.homeSlot)}
                        candidates={candidatesForThirds}
                      />
                    ) : (
                      <TeamCell team={homeTeam} fallback={formatSlot(m.homeSlot)} />
                    )}
                  </div>
                  <span className="font-display text-xl text-muted-foreground">
                    vs
                  </span>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 text-right">
                      {formatSlot(m.awaySlot)}
                    </div>
                    {awayIsThird ? (
                      <KoSlotAssigner
                        matchId={m.id}
                        side="away"
                        currentTeamId={m.awayTeamId ?? null}
                        slotLabel={formatSlot(m.awaySlot)}
                        candidates={candidatesForThirds}
                      />
                    ) : (
                      <TeamCell team={awayTeam} fallback={formatSlot(m.awaySlot)} />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TeamCell({
  team,
  fallback,
}: {
  team: { name: string; flagCode: string; groupLetter: string | null } | undefined;
  fallback: string | null;
}) {
  if (!team) {
    return (
      <span className="text-sm italic text-muted-foreground">
        {fallback ?? "—"}
      </span>
    );
  }
  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://flagcdn.com/${team.flagCode}.svg`}
        alt=""
        className="w-6 h-4 rounded-sm border border-border object-cover"
      />
      <span className="font-bold text-sm truncate">{team.name}</span>
    </div>
  );
}

function Stat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div
        className={`font-display text-2xl md:text-3xl tabular-nums ${
          highlight ? "text-destructive" : ""
        }`}
      >
        {value}
      </div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
