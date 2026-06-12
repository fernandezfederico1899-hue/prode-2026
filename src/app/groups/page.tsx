import { getGroupStandings } from "@/server/queries/standings";
import { GroupCard } from "@/components/groups/group-card";

// Render dinámico: los resultados los actualiza el cron de sync (fuera de
// cualquier revalidatePath), así que no podemos prerenderizar.
export const dynamic = "force-dynamic";

export default async function GroupsPage() {
  const groupStandings = await getGroupStandings();
  const letters = Object.keys(groupStandings).sort();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">FASE DE GRUPOS</h1>
        <p className="text-muted-foreground mt-1">
          12 grupos de 4 equipos. Los <strong>2 primeros</strong> de cada grupo
          + los 8 mejores terceros pasan a 16avos de final.
        </p>
      </header>

      {letters.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Todavía no hay grupos cargados.
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 md:grid-cols-2 xl:grid-cols-3">
          {letters.map((letter) => (
            <GroupCard
              key={letter}
              letter={letter}
              standings={groupStandings[letter]}
              href={`/groups/${letter.toLowerCase()}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
