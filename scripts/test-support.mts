/**
 * Andamiaje compartido de los tests. Ver scripts/test-bracket.mts para cómo
 * levantar la base desechable que necesitan.
 */
import postgres from "postgres";

/**
 * Valida TEST_DATABASE_URL y prepara el entorno ANTES de que se importe `@/db`
 * (ese módulo lee env.DATABASE_URL al importarse). Devuelve la URL validada.
 *
 * Los tests hacen DELETE FROM matches: si esto apuntara a prod, vaciaría el
 * torneo. De ahí la guarda de localhost.
 */
export function prepareTestEnv(): string {
  const url = process.env.TEST_DATABASE_URL;

  if (!url) {
    console.error(
      "TEST_DATABASE_URL no está seteada. Estos tests BORRAN TABLAS: apuntalos a una base desechable.\n" +
        "Ver las instrucciones al principio de scripts/test-bracket.mts",
    );
    process.exit(1);
  }

  const host = new URL(url).hostname;
  if (!["localhost", "127.0.0.1", "::1"].includes(host)) {
    console.error(
      `TEST_DATABASE_URL apunta a "${host}", no a localhost. Abortado: estos tests borran tablas.`,
    );
    process.exit(1);
  }

  process.env.DATABASE_URL = url;
  process.env.DIRECT_URL = url;
  // Sin esto `db` cae en NODE_ENV=development y loguea cada query. Via
  // Object.assign porque los tipos de Node declaran NODE_ENV como readonly.
  Object.assign(process.env, { NODE_ENV: "test" });
  process.env.AUTH_SECRET ??= "test".repeat(8);
  process.env.NEXTAUTH_URL ??= "http://localhost:3000";
  process.env.FOOTBALL_DATA_TOKEN ??= "test-token";
  process.env.ADMIN_EMAIL ??= "test@example.com";

  return url;
}

let failed = 0;

export function check(name: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    console.log(`  PASS  ${name}`);
  } else {
    console.log(`  FAIL  ${name}\n        esperado ${e}\n        obtuvo   ${a}`);
    failed++;
  }
}

/** Imprime el resultado y termina el proceso con el código adecuado. */
export function finish(sql: postgres.Sql): never {
  console.log(
    failed === 0 ? "\nTODOS LOS CASOS PASARON" : `\n${failed} CASOS FALLARON`,
  );
  void sql.end();
  process.exit(failed === 0 ? 0 : 1);
}

export type SeededMatch = {
  num: number;
  stage: string;
  status: string;
  home?: string;
  away?: string;
  hs?: number;
  as?: number;
  sw?: string;
  hSrc?: number;
  hOut?: string;
  aSrc?: number;
  aOut?: string;
  /** Offset del kickoff respecto de ahora, en horas. Default: +240 (lejos). */
  kickoffInHours?: number;
  fixtureId?: number;
};

/** Sembrador de un cuadro mínimo. `ids` se llena con nombre -> uuid. */
export class Fixture {
  readonly ids: Record<string, string> = {};

  constructor(
    private readonly sql: postgres.Sql,
    private readonly teams: string[],
  ) {}

  async reset() {
    await this.sql`DELETE FROM matches`;
    await this.sql`DELETE FROM teams`;
    for (const name of this.teams) {
      const code = name.slice(0, 3).toUpperCase();
      const [r] = await this.sql`
        INSERT INTO teams (name, openfootball_name, fifa_code, flag_code)
        VALUES (${name}, ${name}, ${code}, ${code.toLowerCase()})
        RETURNING id`;
      this.ids[name] = r.id;
    }
  }

  async insert(m: SeededMatch): Promise<string> {
    const kickoff = new Date(
      Date.now() + (m.kickoffInHours ?? 240) * 3600 * 1000,
    );
    const [r] = await this.sql`
      INSERT INTO matches (
        openfootball_match_id, match_num, stage, status, api_sports_fixture_id,
        home_team_id, away_team_id, home_score, away_score, shootout_winner,
        home_source_match_num, home_source_outcome,
        away_source_match_num, away_source_outcome,
        kickoff_at, venue
      ) VALUES (
        ${"t-" + m.num}, ${m.num}, ${m.stage}, ${m.status}, ${m.fixtureId ?? null},
        ${m.home ? this.ids[m.home] : null}, ${m.away ? this.ids[m.away] : null},
        ${m.hs ?? null}, ${m.as ?? null}, ${m.sw ?? null},
        ${m.hSrc ?? null}, ${m.hOut ?? null},
        ${m.aSrc ?? null}, ${m.aOut ?? null},
        ${kickoff.toISOString()}, ${"Test"}
      ) RETURNING id`;
    return r.id as string;
  }

  /** Nombre del equipo en un slot, o null si sigue vacío. */
  async slotOf(num: number, side: "home" | "away") {
    const [r] = await this.sql`
      SELECT home_team_id, away_team_id FROM matches WHERE match_num=${num}`;
    const id = side === "home" ? r.home_team_id : r.away_team_id;
    if (!id) return null;
    return Object.keys(this.ids).find((n) => this.ids[n] === id) ?? "???";
  }
}
