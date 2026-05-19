import { Trophy } from "lucide-react";
import { currentUserSpecialPicks, tournamentConfig } from "@/lib/mock-data";
import { SpecialPicksForm } from "@/components/specials/special-picks-form";

export default function SpecialsPage() {
  const now = new Date();
  const locked = tournamentConfig.tournamentStartsAt.getTime() < now.getTime();

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header className="text-center">
        <Trophy className="w-12 h-12 mx-auto mb-3 text-accent" />
        <h1 className="font-display text-4xl md:text-5xl">
          PRONÓSTICOS ESPECIALES
        </h1>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Apostá a quién va a ser <strong>campeón</strong>,{" "}
          <strong>goleador</strong>, mejor jugador y más. Suma puntos bonus que
          se reparten al final del torneo.
        </p>
      </header>

      <SpecialPicksForm
        initialPicks={currentUserSpecialPicks}
        locked={locked}
      />
    </div>
  );
}
