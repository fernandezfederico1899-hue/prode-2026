import { Trophy } from "lucide-react";
import { bracket } from "@/lib/mock-data";
import { BracketColumn } from "@/components/bracket/bracket-column";

export default function BracketPage() {
  const r16 = bracket.filter((m) => m.stage === "round_of_16");
  const qf = bracket.filter((m) => m.stage === "quarter");
  const sf = bracket.filter((m) => m.stage === "semi");
  const thirdPlace = bracket.filter((m) => m.stage === "third_place");
  const final = bracket.filter((m) => m.stage === "final");

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">LLAVE</h1>
        <p className="text-muted-foreground mt-1">
          Cuadro de eliminatoria desde Octavos hasta la Final. Desplazá hacia la
          derecha en mobile para ver todas las fases.
        </p>
      </header>

      {/* Bracket: scroll horizontal en mobile, todo visible en desktop */}
      <div className="relative -mx-4 md:mx-0">
        <div className="overflow-x-auto px-4 md:px-0 pb-4">
          <div className="grid grid-cols-[repeat(5,minmax(200px,1fr))] gap-4 md:gap-6 min-w-max md:min-w-0">
            <BracketColumn title="Octavos" matches={r16} />
            <BracketColumn title="Cuartos" matches={qf} />
            <BracketColumn title="Semis" matches={sf} />
            <BracketColumn title="3° Puesto" matches={thirdPlace} />
            <BracketColumn title="Final" matches={final} />
          </div>
        </div>
      </div>

      {/* Final placeholder con copa */}
      <div className="rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 p-6 text-center">
        <Trophy className="w-10 h-10 mx-auto mb-3 text-accent" />
        <p className="font-display text-xl md:text-2xl">
          ¿QUIÉN GANA EL MUNDIAL?
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Cargá tu campeón en{" "}
          <a href="/specials" className="text-primary font-bold hover:underline">
            Pronósticos Especiales
          </a>
          .
        </p>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        En producción: 32avos (16 partidos previos) cargados desde el fixture y
        cruces calculados automáticamente al cerrar la fase de grupos.
      </p>
    </div>
  );
}
