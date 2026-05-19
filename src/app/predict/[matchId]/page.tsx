import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, MapPin } from "lucide-react";
import { auth } from "@/lib/auth";
import { getMatchByIdWithTeams } from "@/server/queries/matches";
import { getUserPredictionForMatch } from "@/server/queries/predictions";
import { PredictForm } from "./predict-form";

const DATE_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default async function PredictMatchPage({
  params,
}: {
  params: Promise<{ matchId: string }>;
}) {
  const { matchId } = await params;
  const match = await getMatchByIdWithTeams(matchId);
  if (!match) notFound();

  const session = await auth();
  const existing = session?.user?.id
    ? await getUserPredictionForMatch(session.user.id, match.id)
    : null;
  const isLocked = match.status !== "scheduled" && match.status !== "postponed";

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
      <Link
        href="/predict"
        className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </Link>

      <header className="text-center mb-8">
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          {match.stage === "group" ? `Grupo ${match.groupLetter}` : match.stage}
        </p>
        <h1 className="font-display text-3xl md:text-5xl mt-1">
          {match.homeTeam.fifaCode} VS {match.awayTeam.fifaCode}
        </h1>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground mt-2">
          <span className="inline-flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {DATE_FORMAT.format(match.kickoffAt)}
          </span>
        </div>
        <div className="text-xs text-muted-foreground mt-1 inline-flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {match.venue}
        </div>
      </header>

      <PredictForm
        match={match}
        initialHome={existing?.homeScore ?? 0}
        initialAway={existing?.awayScore ?? 0}
        locked={isLocked}
      />
    </div>
  );
}
