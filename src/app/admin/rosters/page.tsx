import { asc, count, eq } from "drizzle-orm";
import { AlertCircle } from "lucide-react";
import { db } from "@/db";
import { players, teams } from "@/db/schema";
import { SyncRostersButton } from "@/components/admin/sync-rosters-button";

export default async function AdminRostersPage() {
  const teamsWithCounts = await db
    .select({
      id: teams.id,
      name: teams.name,
      fifaCode: teams.fifaCode,
      flagCode: teams.flagCode,
      groupLetter: teams.groupLetter,
      apiSportsId: teams.apiSportsId,
      playerCount: count(players.id),
    })
    .from(teams)
    .leftJoin(players, eq(players.teamId, teams.id))
    .groupBy(teams.id)
    .orderBy(asc(teams.groupLetter), asc(teams.name));

  const mapped = teamsWithCounts.filter((t) => t.apiSportsId !== null);
  const unmapped = teamsWithCounts.filter((t) => t.apiSportsId === null);
  const totalPlayers = teamsWithCounts.reduce(
    (acc, t) => acc + Number(t.playerCount),
    0,
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-8">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">ROSTERS</h1>
        <p className="text-muted-foreground mt-1">
          Sincroniza las plantillas de cada selección desde API-Sports.
        </p>
      </header>

      <section className="rounded-xl border-2 border-border bg-card p-5 md:p-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Stat label="Equipos mapeados" value={mapped.length} total={teamsWithCounts.length} />
          <Stat label="Sin mapear" value={unmapped.length} highlight={unmapped.length > 0} />
          <Stat label="Jugadores totales" value={totalPlayers} />
          <Stat label="API calls necesarios" value={mapped.length} />
        </div>

        {unmapped.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm">
            <p className="font-bold text-destructive flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              Equipos sin mapear:
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {unmapped.map((t) => t.name).join(", ")}
            </p>
            <p className="mt-2 text-xs">
              Corré <code className="bg-muted px-1 py-0.5 rounded">node --env-file=.env.local scripts/map-team-ids.mjs</code> para resolverlos.
            </p>
          </div>
        )}

        <SyncRostersButton eligibleCount={mapped.length} />
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">PLANTILLAS</h2>
        <div className="grid gap-2">
          {teamsWithCounts.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 p-3 rounded-md border border-border bg-card"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/${t.flagCode}.svg`}
                alt=""
                className="w-8 h-6 rounded border border-border object-cover shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{t.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t.fifaCode} · Grupo {t.groupLetter}
                  {t.apiSportsId && ` · API id ${t.apiSportsId}`}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl tabular-nums">
                  {String(t.playerCount)}
                </div>
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  jugadores
                </div>
              </div>
              {!t.apiSportsId && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-destructive/10 text-destructive border border-destructive/30">
                  Sin map
                </span>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  total,
  highlight,
}: {
  label: string;
  value: number;
  total?: number;
  highlight?: boolean;
}) {
  return (
    <div className="space-y-1">
      <div
        className={`font-display text-3xl tabular-nums ${highlight ? "text-destructive" : ""}`}
      >
        {value}
        {total !== undefined && (
          <span className="text-base text-muted-foreground">/{total}</span>
        )}
      </div>
      <div className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </div>
    </div>
  );
}
