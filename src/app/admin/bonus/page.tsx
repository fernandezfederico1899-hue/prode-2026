import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { teams, tournamentConfig } from "@/db/schema";
import { getAllPlayersWithTeam } from "@/server/queries/players";
import { BonusForm } from "@/components/admin/bonus-form";

// Render dinámico: lee config/rosters que cambian fuera de revalidatePath.
export const dynamic = "force-dynamic";

export default async function AdminBonusPage() {
  const [allTeams, players, config] = await Promise.all([
    db.select().from(teams).orderBy(asc(teams.name)),
    getAllPlayersWithTeam(),
    db.query.tournamentConfig.findFirst({
      where: eq(tournamentConfig.id, 1),
      columns: { bonusResults: true, bonusResolvedAt: true },
    }),
  ]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">BONUS</h1>
        <p className="text-muted-foreground mt-1">
          Cargá los resultados finales del Mundial y calculá los puntos bonus
          de los pronósticos especiales.
        </p>
        <p className="text-xs text-muted-foreground mt-2">
          Flujo: guardar resultados (los podés ir cargando a medida que se van
          sabiendo) → cuando todos estén definidos, apretar{" "}
          <strong>Calcular bonus</strong> para repartir los puntos.
        </p>
      </header>

      <div className="rounded-xl border-2 border-border bg-card p-5 md:p-6">
        <BonusForm
          teams={allTeams}
          players={players}
          initial={config?.bonusResults ?? null}
          bonusResolvedAt={config?.bonusResolvedAt ?? null}
        />
      </div>
    </div>
  );
}
