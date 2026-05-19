import { ConfigForm } from "@/components/admin/config-form";
import { getTournamentConfig } from "@/server/queries/tournament-config";
import { env } from "@/lib/env";

export default async function AdminConfigPage() {
  const config = await getTournamentConfig();
  const tournamentStarted = config
    ? config.tournamentStartsAt.getTime() <= Date.now()
    : false;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">CONFIG</h1>
        <p className="text-muted-foreground mt-1">
          Parámetros del torneo. Algunos se lockean al primer kickoff.
        </p>
      </header>

      {config ? (
        <ConfigForm
          initial={{
            pozoAmountArs: config.pozoAmountArs,
            tournamentStartsAt: config.tournamentStartsAt.toISOString(),
          }}
          tournamentStarted={tournamentStarted}
          adminEmail={env.ADMIN_EMAIL}
        />
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          tournament_config no inicializada. Correr `pnpm db:seed`.
        </div>
      )}
    </div>
  );
}
