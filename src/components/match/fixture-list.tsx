"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSlot } from "@/lib/bracket-format";
import type { MatchForFixture } from "@/lib/types";

const TZ = "America/Argentina/Buenos_Aires";

const TIME_FORMAT = new Intl.DateTimeFormat("es-AR", {
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TZ,
});
const DAY_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "long",
  day: "2-digit",
  month: "long",
  timeZone: TZ,
});
const CHIP_WEEKDAY_FORMAT = new Intl.DateTimeFormat("es-AR", {
  weekday: "short",
  timeZone: TZ,
});
const CHIP_DAY_FORMAT = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  timeZone: TZ,
});
// Clave de día estable (YYYY-MM-DD en TZ Argentina) para agrupar y comparar.
const DAY_KEY_FORMAT = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: TZ,
});

function stageLabel(match: MatchForFixture): string {
  switch (match.stage) {
    case "group":
      return `GRUPO ${match.groupLetter}`;
    case "round_of_32":
      return "16AVOS";
    case "round_of_16":
      return "OCTAVOS";
    case "quarter":
      return "CUARTOS";
    case "semi":
      return "SEMIS";
    case "third_place":
      return "3° PUESTO";
    case "final":
      return "FINAL";
    default:
      return "";
  }
}

type DayGroup = {
  key: string;
  label: string;
  chipWeekday: string;
  chipDay: string;
  matches: MatchForFixture[];
};

function groupByDay(matches: MatchForFixture[]): DayGroup[] {
  const sorted = [...matches].sort(
    (a, b) => a.kickoffAt.getTime() - b.kickoffAt.getTime(),
  );
  const groups: DayGroup[] = [];
  for (const m of sorted) {
    const key = DAY_KEY_FORMAT.format(m.kickoffAt);
    let group = groups[groups.length - 1];
    if (!group || group.key !== key) {
      group = {
        key,
        label: DAY_FORMAT.format(m.kickoffAt),
        chipWeekday: CHIP_WEEKDAY_FORMAT.format(m.kickoffAt),
        chipDay: CHIP_DAY_FORMAT.format(m.kickoffAt),
        matches: [],
      };
      groups.push(group);
    }
    group.matches.push(m);
  }
  return groups;
}

export function FixtureList({ matches }: { matches: MatchForFixture[] }) {
  const days = useMemo(() => groupByDay(matches), [matches]);

  // SSR arranca en el primer día (determinístico, sin mismatch de hidratación).
  // "today" depende del cliente y se resuelve tras hidratar.
  const [view, setView] = useState<{ index: number; todayKey: string | null }>({
    index: 0,
    todayKey: null,
  });
  const { index, todayKey } = view;
  const chipsRef = useRef<HTMLDivElement>(null);

  // Al montar: saltar a hoy (o el próximo día con partidos).
  useEffect(() => {
    if (days.length === 0) return;
    const key = DAY_KEY_FORMAT.format(new Date());
    const idx = days.findIndex((d) => d.key >= key);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resolve client-only "today" after hydration
    setView({ todayKey: key, index: idx === -1 ? days.length - 1 : idx });
  }, [days]);

  // Centrar el chip activo en la barra cada vez que cambia el día.
  useEffect(() => {
    const el = chipsRef.current?.querySelector<HTMLElement>(
      `[data-day-index="${index}"]`,
    );
    el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, [index]);

  if (days.length === 0) return null;

  const day = days[index];
  const setIndex = (updater: (i: number) => number) =>
    setView((v) => ({ ...v, index: updater(v.index) }));
  const goTo = (i: number) => setView((v) => ({ ...v, index: i }));

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Navegador de fecha: flechas + día actual */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          aria-label="Día anterior"
          className="p-2 rounded-md border-2 border-border hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <h3 className="font-display text-xl md:text-2xl text-primary uppercase text-center flex-1 truncate">
          {day.label}
        </h3>

        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(days.length - 1, i + 1))}
          disabled={index === days.length - 1}
          aria-label="Día siguiente"
          className="p-2 rounded-md border-2 border-border hover:bg-muted/50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      {/* Slide bar de fechas */}
      <div
        ref={chipsRef}
        className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth"
      >
        {days.map((d, i) => {
          const isActive = i === index;
          const isToday = d.key === todayKey;
          return (
            <button
              key={d.key}
              type="button"
              data-day-index={i}
              onClick={() => goTo(i)}
              className={cn(
                "shrink-0 flex flex-col items-center justify-center w-11 py-1 rounded-md border transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-muted/50",
              )}
            >
              <span className="text-[9px] font-bold uppercase tracking-wide leading-tight">
                {d.chipWeekday.replace(".", "")}
              </span>
              <span className="text-xs font-bold tabular-nums leading-tight">
                {d.chipDay}
              </span>
              {isToday && (
                <span
                  className={cn(
                    "w-1 h-1 rounded-full mt-0.5",
                    isActive ? "bg-primary-foreground" : "bg-primary",
                  )}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Partidos del día seleccionado */}
      <ul className="rounded-lg border-2 border-border bg-card divide-y divide-border overflow-hidden">
        {day.matches.map((m) => (
          <FixtureRow key={m.id} match={m} />
        ))}
      </ul>
    </div>
  );
}

function FixtureRow({ match }: { match: MatchForFixture }) {
  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  const showScore =
    (isFinished || isLive) &&
    match.homeScore !== null &&
    match.awayScore !== null;

  return (
    <li>
      <Link
        href={`/matches/${match.id}`}
        className="flex items-center gap-2 px-3 py-2 hover:bg-muted/40 transition-colors"
      >
        {/* Hora / estado */}
        <span
          className={cn(
            "w-12 shrink-0 text-xs font-bold tabular-nums",
            isLive ? "text-[color:var(--live)]" : "text-muted-foreground",
          )}
        >
          {isLive ? "VIVO" : TIME_FORMAT.format(match.kickoffAt)}
        </span>

        {/* Equipos en puntas opuestas, con el marcador/vs centrado */}
        <div className="flex-1 grid grid-cols-[1fr_auto_1fr] items-center gap-2 md:gap-3">
          <TeamSide team={match.homeTeam} slot={match.homeSlot} side="home" />

          {/* Resultado o vs (centrado) */}
          <span className="font-display text-base md:text-lg tabular-nums text-center min-w-[2.25rem]">
            {showScore ? (
              <span className={isLive ? "text-[color:var(--live)]" : ""}>
                {match.homeScore}-{match.awayScore}
              </span>
            ) : (
              <span className="text-muted-foreground/50 text-sm">vs</span>
            )}
          </span>

          <TeamSide team={match.awayTeam} slot={match.awaySlot} side="away" />
        </div>
      </Link>

      {/* Etiqueta de fase: alineada con el vs (mismo espaciador que la hora) */}
      <div className="flex items-center gap-2 px-3 pb-1.5 -mt-1">
        <span className="w-12 shrink-0" aria-hidden="true" />
        <span className="flex-1 text-center text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
          {stageLabel(match)}
        </span>
      </div>
    </li>
  );
}

function TeamSide({
  team,
  slot,
  side,
}: {
  team: MatchForFixture["homeTeam"];
  slot: string | null;
  side: "home" | "away";
}) {
  const flag = team ? (
    <span className="inline-block w-6 h-[18px] overflow-hidden rounded-[2px] border border-border shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://flagcdn.com/${team.flagCode}.svg`}
        alt=""
        className="block w-full h-full object-cover"
        aria-hidden="true"
      />
    </span>
  ) : null;

  const name = (
    <span
      className={cn(
        "text-sm font-semibold uppercase tracking-wide truncate",
        side === "home" ? "text-left" : "text-right",
        !team && "text-muted-foreground/80 normal-case font-normal italic",
      )}
    >
      {team ? team.name : formatSlot(slot)}
    </span>
  );

  // Local: bandera en el extremo izquierdo, nombre hacia el centro.
  // Visitante: nombre hacia el centro, bandera en el extremo derecho.
  return (
    <span
      className={cn(
        "flex items-center gap-2 min-w-0",
        side === "home" ? "justify-start" : "justify-end",
      )}
    >
      {side === "home" ? (
        <>
          {flag}
          {name}
        </>
      ) : (
        <>
          {name}
          {flag}
        </>
      )}
    </span>
  );
}
