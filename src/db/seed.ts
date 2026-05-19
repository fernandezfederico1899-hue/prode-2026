// Las env vars se cargan vía `tsx --env-file=.env.local` (ver package.json).
import { db } from "./index";
import { matches, teams, tournamentConfig } from "./schema";

// ============================================================
// Tournament config (singleton id = 1)
// ============================================================

const TOURNAMENT_STARTS_AT = new Date("2026-06-11T17:00:00.000-03:00");

// ============================================================
// Teams (32 confirmados para WC 2026 — Mundial real tiene 48,
// el resto se suma cuando openfootball publique el fixture final)
// ============================================================

const TEAMS_DATA: Array<{
  fifaCode: string;
  name: string;
  flagCode: string;
  groupLetter: string;
}> = [
  // Grupo A
  { fifaCode: "ARG", name: "Argentina", flagCode: "ar", groupLetter: "A" },
  { fifaCode: "MEX", name: "México", flagCode: "mx", groupLetter: "A" },
  { fifaCode: "MAR", name: "Marruecos", flagCode: "ma", groupLetter: "A" },
  { fifaCode: "URU", name: "Uruguay", flagCode: "uy", groupLetter: "A" },
  // Grupo B
  { fifaCode: "ESP", name: "España", flagCode: "es", groupLetter: "B" },
  { fifaCode: "USA", name: "Estados Unidos", flagCode: "us", groupLetter: "B" },
  { fifaCode: "NED", name: "Países Bajos", flagCode: "nl", groupLetter: "B" },
  { fifaCode: "SEN", name: "Senegal", flagCode: "sn", groupLetter: "B" },
  // Grupo C
  { fifaCode: "BRA", name: "Brasil", flagCode: "br", groupLetter: "C" },
  { fifaCode: "ENG", name: "Inglaterra", flagCode: "gb", groupLetter: "C" },
  { fifaCode: "JPN", name: "Japón", flagCode: "jp", groupLetter: "C" },
  { fifaCode: "SUI", name: "Suiza", flagCode: "ch", groupLetter: "C" },
  // Grupo D
  { fifaCode: "FRA", name: "Francia", flagCode: "fr", groupLetter: "D" },
  { fifaCode: "GER", name: "Alemania", flagCode: "de", groupLetter: "D" },
  { fifaCode: "POR", name: "Portugal", flagCode: "pt", groupLetter: "D" },
  { fifaCode: "COL", name: "Colombia", flagCode: "co", groupLetter: "D" },
  // Grupo E
  { fifaCode: "CRO", name: "Croacia", flagCode: "hr", groupLetter: "E" },
  { fifaCode: "BEL", name: "Bélgica", flagCode: "be", groupLetter: "E" },
  // Grupo F
  { fifaCode: "DEN", name: "Dinamarca", flagCode: "dk", groupLetter: "F" },
  { fifaCode: "POL", name: "Polonia", flagCode: "pl", groupLetter: "F" },
  // Grupo G
  { fifaCode: "AUS", name: "Australia", flagCode: "au", groupLetter: "G" },
  { fifaCode: "ECU", name: "Ecuador", flagCode: "ec", groupLetter: "G" },
  // Grupo H
  { fifaCode: "KOR", name: "Corea del Sur", flagCode: "kr", groupLetter: "H" },
  { fifaCode: "IRN", name: "Irán", flagCode: "ir", groupLetter: "H" },
  // Grupo I
  { fifaCode: "CAN", name: "Canadá", flagCode: "ca", groupLetter: "I" },
  { fifaCode: "TUN", name: "Túnez", flagCode: "tn", groupLetter: "I" },
  // Grupo J
  { fifaCode: "NGA", name: "Nigeria", flagCode: "ng", groupLetter: "J" },
  { fifaCode: "EGY", name: "Egipto", flagCode: "eg", groupLetter: "J" },
  // Grupo K
  { fifaCode: "SRB", name: "Serbia", flagCode: "rs", groupLetter: "K" },
  { fifaCode: "WAL", name: "Gales", flagCode: "gb-wls", groupLetter: "K" },
  // Grupo L
  { fifaCode: "PAR", name: "Paraguay", flagCode: "py", groupLetter: "L" },
  { fifaCode: "TUR", name: "Turquía", flagCode: "tr", groupLetter: "L" },
];

// ============================================================
// Helper: días desde la fecha de inicio del torneo
// ============================================================

function dayOfTournament(dayOffset: number, hourArt = 17): Date {
  const d = new Date(TOURNAMENT_STARTS_AT);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  d.setUTCHours(hourArt + 3, 0, 0, 0); // ART = UTC-3, así que hora ART X = UTC X+3
  return d;
}

// ============================================================
// Matches del fixture (group stage de los grupos A-D)
// 12 partidos para arrancar; los del KO se generan post-grupos.
// ============================================================

const MATCHES_DATA: Array<{
  homeCode: string;
  awayCode: string;
  kickoff: Date;
  venue: string;
  group: string;
}> = [
  // Grupo A
  { homeCode: "MEX", awayCode: "MAR", kickoff: dayOfTournament(0, 17), venue: "Estadio Azteca, México DF", group: "A" },
  { homeCode: "ARG", awayCode: "URU", kickoff: dayOfTournament(1, 16), venue: "MetLife Stadium, New York", group: "A" },
  { homeCode: "ARG", awayCode: "MEX", kickoff: dayOfTournament(5, 16), venue: "SoFi Stadium, Los Angeles", group: "A" },
  // Grupo B
  { homeCode: "ESP", awayCode: "SEN", kickoff: dayOfTournament(1, 13), venue: "SoFi Stadium, Los Angeles", group: "B" },
  { homeCode: "NED", awayCode: "USA", kickoff: dayOfTournament(2, 16), venue: "Lumen Field, Seattle", group: "B" },
  { homeCode: "ESP", awayCode: "NED", kickoff: dayOfTournament(6, 16), venue: "AT&T Stadium, Dallas", group: "B" },
  // Grupo C
  { homeCode: "BRA", awayCode: "SUI", kickoff: dayOfTournament(2, 13), venue: "Hard Rock Stadium, Miami", group: "C" },
  { homeCode: "ENG", awayCode: "JPN", kickoff: dayOfTournament(3, 16), venue: "BC Place, Vancouver", group: "C" },
  { homeCode: "BRA", awayCode: "ENG", kickoff: dayOfTournament(7, 16), venue: "MetLife Stadium, New York", group: "C" },
  // Grupo D
  { homeCode: "FRA", awayCode: "COL", kickoff: dayOfTournament(3, 13), venue: "Mercedes-Benz Stadium, Atlanta", group: "D" },
  { homeCode: "GER", awayCode: "POR", kickoff: dayOfTournament(4, 16), venue: "Levi's Stadium, San Francisco", group: "D" },
  { homeCode: "FRA", awayCode: "GER", kickoff: dayOfTournament(8, 16), venue: "Arrowhead Stadium, Kansas City", group: "D" },
];

// ============================================================
// Run
// ============================================================

async function seed() {
  console.log("🌱 Iniciando seed...");

  // 1. tournament_config singleton (id=1)
  console.log("→ tournament_config");
  await db
    .insert(tournamentConfig)
    .values({
      id: 1,
      pozoAmountArs: 20000,
      tournamentStartsAt: TOURNAMENT_STARTS_AT,
      poolLocked: false,
      apiSportsDailyCount: 0,
      apiSportsCountDate: new Date().toISOString().slice(0, 10),
    })
    .onConflictDoNothing();

  // 2. Teams
  console.log(`→ teams (${TEAMS_DATA.length})`);
  const insertedTeams = await db
    .insert(teams)
    .values(
      TEAMS_DATA.map((t) => ({
        fifaCode: t.fifaCode,
        name: t.name,
        flagCode: t.flagCode,
        openfootballName: t.name,
        groupLetter: t.groupLetter,
      })),
    )
    .onConflictDoNothing()
    .returning({ id: teams.id, fifaCode: teams.fifaCode });

  // Re-leer todos los teams para tener el mapping completo
  const allTeams = await db.query.teams.findMany();
  const teamByCode = new Map(allTeams.map((t) => [t.fifaCode, t]));

  console.log(`  ✓ ${insertedTeams.length} insertados (resto ya existía)`);

  // 3. Matches (group stage)
  console.log(`→ matches (${MATCHES_DATA.length})`);
  for (const m of MATCHES_DATA) {
    const home = teamByCode.get(m.homeCode);
    const away = teamByCode.get(m.awayCode);
    if (!home || !away) {
      console.warn(`  ⚠ teams not found: ${m.homeCode} vs ${m.awayCode}`);
      continue;
    }
    await db
      .insert(matches)
      .values({
        homeTeamId: home.id,
        awayTeamId: away.id,
        kickoffAt: m.kickoff,
        venue: m.venue,
        stage: "group",
        groupLetter: m.group,
        status: "scheduled",
      })
      .onConflictDoNothing();
  }

  console.log("✓ Seed completo.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ Seed falló:", err);
    process.exit(1);
  });
