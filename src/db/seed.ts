// Seed real del Mundial 2026 con data oficial post-draw.
// Fuente: openfootball/worldcup.json (https://github.com/openfootball/worldcup.json)
// - 48 equipos en 12 grupos
// - 72 partidos de fase de grupos con fechas y sedes oficiales
// - Los partidos de KO (R32 y posteriores) tienen placeholders (W95, L101) que
//   se resuelven cuando se definen los cruces — los saltamos en este seed.
//
// Ejecutar con: pnpm db:seed (usa --env-file=.env.local)

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { db } from "./index";
import { matches, teams, tournamentConfig } from "./schema";

// ============================================================
// Mapping: nombre openfootball → datos del equipo
// ============================================================

type TeamSpec = {
  fifaCode: string;
  nameEs: string;
  flagCode: string; // ISO 3166-1 alpha-2 lowercase
};

const TEAM_MAP: Record<string, TeamSpec> = {
  // Grupo A
  Mexico: { fifaCode: "MEX", nameEs: "México", flagCode: "mx" },
  "South Africa": { fifaCode: "RSA", nameEs: "Sudáfrica", flagCode: "za" },
  "South Korea": { fifaCode: "KOR", nameEs: "Corea del Sur", flagCode: "kr" },
  "Czech Republic": {
    fifaCode: "CZE",
    nameEs: "República Checa",
    flagCode: "cz",
  },
  // Grupo B
  Canada: { fifaCode: "CAN", nameEs: "Canadá", flagCode: "ca" },
  "Bosnia & Herzegovina": {
    fifaCode: "BIH",
    nameEs: "Bosnia y Herzegovina",
    flagCode: "ba",
  },
  Qatar: { fifaCode: "QAT", nameEs: "Qatar", flagCode: "qa" },
  Switzerland: { fifaCode: "SUI", nameEs: "Suiza", flagCode: "ch" },
  // Grupo C
  Brazil: { fifaCode: "BRA", nameEs: "Brasil", flagCode: "br" },
  Morocco: { fifaCode: "MAR", nameEs: "Marruecos", flagCode: "ma" },
  Haiti: { fifaCode: "HAI", nameEs: "Haití", flagCode: "ht" },
  Scotland: { fifaCode: "SCO", nameEs: "Escocia", flagCode: "gb-sct" },
  // Grupo D
  USA: { fifaCode: "USA", nameEs: "Estados Unidos", flagCode: "us" },
  Paraguay: { fifaCode: "PAR", nameEs: "Paraguay", flagCode: "py" },
  Australia: { fifaCode: "AUS", nameEs: "Australia", flagCode: "au" },
  Turkey: { fifaCode: "TUR", nameEs: "Turquía", flagCode: "tr" },
  // Grupo E
  Germany: { fifaCode: "GER", nameEs: "Alemania", flagCode: "de" },
  Curaçao: { fifaCode: "CUW", nameEs: "Curazao", flagCode: "cw" },
  "Ivory Coast": { fifaCode: "CIV", nameEs: "Costa de Marfil", flagCode: "ci" },
  Ecuador: { fifaCode: "ECU", nameEs: "Ecuador", flagCode: "ec" },
  // Grupo F
  Netherlands: { fifaCode: "NED", nameEs: "Países Bajos", flagCode: "nl" },
  Japan: { fifaCode: "JPN", nameEs: "Japón", flagCode: "jp" },
  Sweden: { fifaCode: "SWE", nameEs: "Suecia", flagCode: "se" },
  Tunisia: { fifaCode: "TUN", nameEs: "Túnez", flagCode: "tn" },
  // Grupo G
  Belgium: { fifaCode: "BEL", nameEs: "Bélgica", flagCode: "be" },
  Egypt: { fifaCode: "EGY", nameEs: "Egipto", flagCode: "eg" },
  Iran: { fifaCode: "IRN", nameEs: "Irán", flagCode: "ir" },
  "New Zealand": { fifaCode: "NZL", nameEs: "Nueva Zelanda", flagCode: "nz" },
  // Grupo H
  Spain: { fifaCode: "ESP", nameEs: "España", flagCode: "es" },
  "Cape Verde": { fifaCode: "CPV", nameEs: "Cabo Verde", flagCode: "cv" },
  "Saudi Arabia": {
    fifaCode: "KSA",
    nameEs: "Arabia Saudita",
    flagCode: "sa",
  },
  Uruguay: { fifaCode: "URU", nameEs: "Uruguay", flagCode: "uy" },
  // Grupo I
  France: { fifaCode: "FRA", nameEs: "Francia", flagCode: "fr" },
  Senegal: { fifaCode: "SEN", nameEs: "Senegal", flagCode: "sn" },
  Iraq: { fifaCode: "IRQ", nameEs: "Iraq", flagCode: "iq" },
  Norway: { fifaCode: "NOR", nameEs: "Noruega", flagCode: "no" },
  // Grupo J
  Argentina: { fifaCode: "ARG", nameEs: "Argentina", flagCode: "ar" },
  Algeria: { fifaCode: "ALG", nameEs: "Argelia", flagCode: "dz" },
  Austria: { fifaCode: "AUT", nameEs: "Austria", flagCode: "at" },
  Jordan: { fifaCode: "JOR", nameEs: "Jordania", flagCode: "jo" },
  // Grupo K
  Portugal: { fifaCode: "POR", nameEs: "Portugal", flagCode: "pt" },
  "DR Congo": { fifaCode: "COD", nameEs: "RD Congo", flagCode: "cd" },
  Uzbekistan: { fifaCode: "UZB", nameEs: "Uzbekistán", flagCode: "uz" },
  Colombia: { fifaCode: "COL", nameEs: "Colombia", flagCode: "co" },
  // Grupo L
  England: { fifaCode: "ENG", nameEs: "Inglaterra", flagCode: "gb-eng" },
  Croatia: { fifaCode: "CRO", nameEs: "Croacia", flagCode: "hr" },
  Ghana: { fifaCode: "GHA", nameEs: "Ghana", flagCode: "gh" },
  Panama: { fifaCode: "PAN", nameEs: "Panamá", flagCode: "pa" },
};

// ============================================================
// Loader del JSON con tipos
// ============================================================

type OpenFootballMatch = {
  round: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM UTC±N
  team1: string;
  team2: string;
  group?: string;
  ground?: string;
};

function loadWorldCupJson(): { matches: OpenFootballMatch[] } {
  const path = resolve(process.cwd(), "src/data/wc2026.json");
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw);
}

// ============================================================
// Helpers
// ============================================================

/**
 * Parsea "HH:MM UTC±N" + "YYYY-MM-DD" en un Date UTC absoluto.
 * Ej "13:00 UTC-6" + "2026-06-11" → Date con .toISOString() === "2026-06-11T19:00:00.000Z"
 */
function parseKickoff(date: string, time: string): Date {
  const match = time.match(/^(\d{2}):(\d{2})\s+UTC([+-]\d+)$/);
  if (!match) throw new Error(`Cannot parse time: ${time}`);
  const [, hh, mm, off] = match;
  const offsetHours = parseInt(off, 10);
  // El offset que da openfootball es la zona local del estadio.
  // hora UTC = hora local - offset
  const localHour = parseInt(hh, 10);
  const utcHour = localHour - offsetHours;
  // Date.UTC permite valores fuera de rango — los normaliza al día/hora correctos.
  const [y, m, d] = date.split("-").map((s) => parseInt(s, 10));
  return new Date(Date.UTC(y, m - 1, d, utcHour, parseInt(mm, 10), 0));
}

function isGroupMatch(round: string): boolean {
  return round.startsWith("Matchday");
}

function groupLetterFromName(group: string | undefined): string | null {
  if (!group) return null;
  const match = group.match(/Group\s+([A-L])/);
  return match ? match[1] : null;
}

// ============================================================
// Run
// ============================================================

async function seed() {
  console.log("🌱 Seed real WC 2026 (data oficial post-draw)\n");

  const data = loadWorldCupJson();
  const allMatches = data.matches;
  const groupMatches = allMatches.filter((m) => isGroupMatch(m.round));
  console.log(
    `→ ${allMatches.length} matches total, ${groupMatches.length} de grupos`,
  );

  // ---------- 1. tournament_config ----------
  // Primer partido = inicio del torneo
  const firstMatch = groupMatches[0];
  const tournamentStartsAt = parseKickoff(firstMatch.date, firstMatch.time);
  console.log(`→ Inicio: ${tournamentStartsAt.toISOString()}`);

  await db
    .insert(tournamentConfig)
    .values({
      id: 1,
      pozoAmountArs: 20000,
      tournamentStartsAt,
      poolLocked: false,
      apiSportsDailyCount: 0,
      apiSportsCountDate: new Date().toISOString().slice(0, 10),
    })
    .onConflictDoUpdate({
      target: tournamentConfig.id,
      set: { tournamentStartsAt },
    });

  // ---------- 2. teams ----------
  // Extraer unique teams del JSON
  const teamNames = new Set<string>();
  for (const m of groupMatches) {
    teamNames.add(m.team1);
    teamNames.add(m.team2);
  }

  const teamsToInsert: Array<{
    fifaCode: string;
    name: string;
    flagCode: string;
    openfootballName: string;
    groupLetter: string;
  }> = [];

  // Mapear cada team del JSON con su grupo
  const teamGroup = new Map<string, string>();
  for (const m of groupMatches) {
    const letter = groupLetterFromName(m.group);
    if (letter) {
      teamGroup.set(m.team1, letter);
      teamGroup.set(m.team2, letter);
    }
  }

  for (const name of teamNames) {
    const spec = TEAM_MAP[name];
    if (!spec) {
      console.warn(`⚠ Team sin mapping: "${name}" — skip`);
      continue;
    }
    teamsToInsert.push({
      fifaCode: spec.fifaCode,
      name: spec.nameEs,
      flagCode: spec.flagCode,
      openfootballName: name,
      groupLetter: teamGroup.get(name) ?? "?",
    });
  }

  console.log(`→ teams: ${teamsToInsert.length}`);
  await db.insert(teams).values(teamsToInsert).onConflictDoNothing();

  // Re-leer para tener IDs
  const allTeams = await db.query.teams.findMany();
  const teamByFifa = new Map(allTeams.map((t) => [t.fifaCode, t]));

  // ---------- 3. matches (group stage) ----------
  console.log(`→ matches (group stage): ${groupMatches.length}`);
  let inserted = 0;
  let skipped = 0;
  for (const m of groupMatches) {
    const homeSpec = TEAM_MAP[m.team1];
    const awaySpec = TEAM_MAP[m.team2];
    if (!homeSpec || !awaySpec) {
      skipped++;
      continue;
    }
    const home = teamByFifa.get(homeSpec.fifaCode);
    const away = teamByFifa.get(awaySpec.fifaCode);
    if (!home || !away) {
      skipped++;
      continue;
    }
    const kickoff = parseKickoff(m.date, m.time);
    const letter = groupLetterFromName(m.group);

    await db
      .insert(matches)
      .values({
        homeTeamId: home.id,
        awayTeamId: away.id,
        kickoffAt: kickoff,
        venue: m.ground ?? null,
        stage: "group",
        groupLetter: letter,
        status: "scheduled",
      })
      .onConflictDoNothing();
    inserted++;
  }

  console.log(`  ✓ ${inserted} insertados (${skipped} skipped)`);
  console.log("\n✓ Seed completo.");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ Seed falló:", err);
    process.exit(1);
  });
