import { groupStandings } from "@/lib/mock-data";
import { GroupCard } from "@/components/groups/group-card";

export default function GroupsPage() {
  const letters = Object.keys(groupStandings).sort();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">FASE DE GRUPOS</h1>
        <p className="text-muted-foreground mt-1">
          Posiciones en cada grupo. Los <strong>2 primeros</strong> de cada
          grupo + mejores terceros pasan a la fase eliminatoria.
        </p>
      </header>

      <div className="grid gap-4 md:gap-6 md:grid-cols-2">
        {letters.map((letter) => (
          <GroupCard
            key={letter}
            letter={letter}
            standings={groupStandings[letter]}
            href={`/groups/${letter.toLowerCase()}`}
          />
        ))}
      </div>
    </div>
  );
}
