import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import {
  groupStandings,
  matches,
  userPredictions,
} from "@/lib/mock-data";
import { GroupCard } from "@/components/groups/group-card";
import { MatchCard } from "@/components/match/match-card";
import { EditableMatchCard } from "@/components/match/editable-match-card";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ letter: string }>;
}) {
  const { letter } = await params;
  const upperLetter = letter.toUpperCase();
  const standings = groupStandings[upperLetter];
  if (!standings) notFound();

  const groupMatches = matches
    .filter((m) => m.groupLetter === upperLetter)
    .sort((a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime());

  const live = groupMatches.filter((m) => m.status === "live");
  const finished = groupMatches.filter((m) => m.status === "finished");
  const upcoming = groupMatches.filter((m) => m.status === "scheduled");

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10 space-y-8">
      <Link
        href="/groups"
        className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a Grupos
      </Link>

      <header>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Fase de Grupos
        </p>
        <h1 className="font-display text-5xl md:text-7xl leading-none mt-1">
          GRUPO {upperLetter}
        </h1>
      </header>

      <section>
        <h2 className="font-display text-2xl mb-4">POSICIONES</h2>
        <GroupCard letter={upperLetter} standings={standings} />
      </section>

      {live.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-4">EN VIVO</h2>
          <div className="grid gap-3 md:gap-4 md:grid-cols-2">
            {live.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                userPrediction={userPredictions[m.id]}
                href={`/matches/${m.id}`}
              />
            ))}
          </div>
        </section>
      )}

      {upcoming.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-4">PRÓXIMOS</h2>
          <div className="grid gap-3 md:gap-4 md:grid-cols-2">
            {upcoming.map((m) => (
              <EditableMatchCard
                key={m.id}
                match={m}
                userPrediction={userPredictions[m.id]}
              />
            ))}
          </div>
        </section>
      )}

      {finished.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-4">FINALIZADOS</h2>
          <div className="grid gap-3 md:gap-4 md:grid-cols-2">
            {finished.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                userPrediction={userPredictions[m.id]}
                href={`/matches/${m.id}`}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
