import Link from "next/link";
import { CalendarClock, LogIn } from "lucide-react";
import { auth } from "@/lib/auth";
import { getKnockoutTree, getUserBracketPicks } from "@/server/queries/bracket";
import { BracketBuilder, type BuilderMatch } from "./bracket-builder";

// Los equipos de los cruces se resuelven fuera de cualquier revalidatePath
// (cuando el admin corre el auto-resolve), así que render dinámico.
export const dynamic = "force-dynamic";

const FIRST_KO_MATCH_NUM = 73;

export default async function BracketPredictPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";

  const [tree, picks] = await Promise.all([
    getKnockoutTree(),
    userId ? getUserBracketPicks(userId) : Promise.resolve({}),
  ]);

  const r32 = tree.filter((n) => n.stage === "round_of_32");
  const ready =
    r32.length > 0 && r32.every((n) => n.homeTeam && n.awayTeam);
  const firstKo = tree.find((n) => n.matchNum === FIRST_KO_MATCH_NUM);
  const locked = firstKo ? firstKo.kickoffAt.getTime() <= Date.now() : false;

  const builderMatches: BuilderMatch[] = tree.map((n) => ({
    matchNum: n.matchNum,
    stage: n.stage,
    homeTeam: toLite(n.homeTeam),
    awayTeam: toLite(n.awayTeam),
    homeSourceMatchNum: n.homeSourceMatchNum,
    awaySourceMatchNum: n.awaySourceMatchNum,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header className="space-y-2">
        <h1 className="font-display text-4xl md:text-5xl">ARMÁ TU CUADRO</h1>
        <p className="text-muted-foreground">
          Elegí quién avanza en cada cruce hasta coronar tu campeón. Sumás{" "}
          <strong className="text-foreground">3 puntos</strong> por cada equipo
          que aciertes que llega a la ronda siguiente.
        </p>
        <p className="text-xs text-muted-foreground">
          Se cierra cuando empieza el primer 16avo. Después no se puede cambiar.
        </p>
      </header>

      {!userId ? (
        <Notice
          icon={<LogIn className="w-10 h-10 mx-auto mb-3 text-accent" />}
          title="Iniciá sesión para armar tu cuadro"
        >
          Entrá con tu cuenta para cargar y guardar tu bracket.
        </Notice>
      ) : !ready ? (
        <Notice
          icon={<CalendarClock className="w-10 h-10 mx-auto mb-3 text-accent" />}
          title="Los cruces todavía no están definidos"
        >
          Cuando termine la fase de grupos y se sorteen los 16avos, vas a poder
          armar tu cuadro acá. Mientras tanto, mirá la{" "}
          <Link href="/bracket" className="text-primary font-bold hover:underline">
            llave oficial
          </Link>
          .
        </Notice>
      ) : (
        <BracketBuilder
          matches={builderMatches}
          initialPicks={picks}
          locked={locked}
        />
      )}
    </div>
  );
}

function toLite(
  team: { id: string; name: string; fifaCode: string; flagCode: string } | null,
) {
  if (!team) return null;
  return {
    id: team.id,
    name: team.name,
    fifaCode: team.fifaCode,
    flagCode: team.flagCode,
  };
}

function Notice({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border-2 border-dashed border-accent/40 bg-accent/5 p-8 text-center">
      {icon}
      <p className="font-display text-2xl">{title}</p>
      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
        {children}
      </p>
    </div>
  );
}
