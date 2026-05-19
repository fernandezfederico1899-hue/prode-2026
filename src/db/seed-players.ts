// Seed de jugadores famosos para que /specials habilite los picks de
// "Goleador" y "Mejor jugador". ~3-5 jugadores por equipo de los 48.
// En producción real, esto vendría sincronizado desde API-Sports.
//
// Ejecutar: pnpm tsx --env-file=.env.local src/db/seed-players.ts

import { db } from "./index";
import { players, teams } from "./schema";

type PlayerSpec = { name: string; position: string };

// Mapa: fifaCode → lista de jugadores. Mantener short (3-5 por team) para
// que el dropdown de Combobox no sea inmanejable.
const ROSTER: Record<string, PlayerSpec[]> = {
  ARG: [
    { name: "Lionel Messi", position: "DEL" },
    { name: "Lautaro Martínez", position: "DEL" },
    { name: "Julián Álvarez", position: "DEL" },
    { name: "Enzo Fernández", position: "MED" },
    { name: "Alexis Mac Allister", position: "MED" },
  ],
  BRA: [
    { name: "Vinícius Júnior", position: "DEL" },
    { name: "Rodrygo", position: "DEL" },
    { name: "Raphinha", position: "DEL" },
    { name: "Endrick", position: "DEL" },
    { name: "Casemiro", position: "MED" },
  ],
  FRA: [
    { name: "Kylian Mbappé", position: "DEL" },
    { name: "Antoine Griezmann", position: "DEL" },
    { name: "Aurélien Tchouaméni", position: "MED" },
    { name: "Eduardo Camavinga", position: "MED" },
    { name: "Ousmane Dembélé", position: "DEL" },
  ],
  ENG: [
    { name: "Jude Bellingham", position: "MED" },
    { name: "Harry Kane", position: "DEL" },
    { name: "Bukayo Saka", position: "DEL" },
    { name: "Phil Foden", position: "MED" },
    { name: "Cole Palmer", position: "MED" },
  ],
  ESP: [
    { name: "Lamine Yamal", position: "DEL" },
    { name: "Pedri", position: "MED" },
    { name: "Rodri", position: "MED" },
    { name: "Nico Williams", position: "DEL" },
    { name: "Álvaro Morata", position: "DEL" },
  ],
  GER: [
    { name: "Florian Wirtz", position: "MED" },
    { name: "Jamal Musiala", position: "MED" },
    { name: "Kai Havertz", position: "DEL" },
    { name: "Joshua Kimmich", position: "MED" },
    { name: "Leroy Sané", position: "DEL" },
  ],
  POR: [
    { name: "Cristiano Ronaldo", position: "DEL" },
    { name: "Bernardo Silva", position: "MED" },
    { name: "Rafael Leão", position: "DEL" },
    { name: "Bruno Fernandes", position: "MED" },
    { name: "João Félix", position: "DEL" },
  ],
  NED: [
    { name: "Memphis Depay", position: "DEL" },
    { name: "Xavi Simons", position: "MED" },
    { name: "Cody Gakpo", position: "DEL" },
    { name: "Virgil van Dijk", position: "DEF" },
    { name: "Frenkie de Jong", position: "MED" },
  ],
  CRO: [
    { name: "Luka Modrić", position: "MED" },
    { name: "Andrej Kramarić", position: "DEL" },
    { name: "Mateo Kovačić", position: "MED" },
    { name: "Josip Brekalo", position: "DEL" },
  ],
  BEL: [
    { name: "Kevin De Bruyne", position: "MED" },
    { name: "Romelu Lukaku", position: "DEL" },
    { name: "Jérémy Doku", position: "DEL" },
    { name: "Charles De Ketelaere", position: "DEL" },
  ],
  URU: [
    { name: "Federico Valverde", position: "MED" },
    { name: "Darwin Núñez", position: "DEL" },
    { name: "Luis Suárez", position: "DEL" },
    { name: "Ronald Araújo", position: "DEF" },
  ],
  COL: [
    { name: "James Rodríguez", position: "MED" },
    { name: "Luis Díaz", position: "DEL" },
    { name: "Jhon Durán", position: "DEL" },
    { name: "Jhon Arias", position: "DEL" },
  ],
  USA: [
    { name: "Christian Pulisic", position: "MED" },
    { name: "Gio Reyna", position: "MED" },
    { name: "Tim Weah", position: "DEL" },
    { name: "Weston McKennie", position: "MED" },
  ],
  MEX: [
    { name: "Hirving Lozano", position: "DEL" },
    { name: "Raúl Jiménez", position: "DEL" },
    { name: "Edson Álvarez", position: "MED" },
    { name: "Santiago Giménez", position: "DEL" },
  ],
  CAN: [
    { name: "Alphonso Davies", position: "DEF" },
    { name: "Jonathan David", position: "DEL" },
    { name: "Cyle Larin", position: "DEL" },
  ],
  MAR: [
    { name: "Achraf Hakimi", position: "DEF" },
    { name: "Hakim Ziyech", position: "DEL" },
    { name: "Youssef En-Nesyri", position: "DEL" },
    { name: "Sofyan Amrabat", position: "MED" },
  ],
  SEN: [
    { name: "Sadio Mané", position: "DEL" },
    { name: "Ismaïla Sarr", position: "DEL" },
    { name: "Édouard Mendy", position: "GK" },
    { name: "Kalidou Koulibaly", position: "DEF" },
  ],
  JPN: [
    { name: "Kaoru Mitoma", position: "DEL" },
    { name: "Takefusa Kubo", position: "MED" },
    { name: "Wataru Endo", position: "MED" },
    { name: "Daichi Kamada", position: "MED" },
  ],
  EGY: [
    { name: "Mohamed Salah", position: "DEL" },
    { name: "Trezeguet", position: "DEL" },
    { name: "Omar Marmoush", position: "DEL" },
  ],
  IRN: [
    { name: "Mehdi Taremi", position: "DEL" },
    { name: "Sardar Azmoun", position: "DEL" },
    { name: "Alireza Jahanbakhsh", position: "DEL" },
  ],
  AUS: [
    { name: "Mathew Leckie", position: "DEL" },
    { name: "Mitchell Duke", position: "DEL" },
    { name: "Awer Mabil", position: "DEL" },
  ],
  ECU: [
    { name: "Enner Valencia", position: "DEL" },
    { name: "Moisés Caicedo", position: "MED" },
    { name: "Pervis Estupiñán", position: "DEF" },
  ],
  PAR: [
    { name: "Miguel Almirón", position: "MED" },
    { name: "Antonio Sanabria", position: "DEL" },
    { name: "Julio Enciso", position: "DEL" },
  ],
  TUR: [
    { name: "Arda Güler", position: "MED" },
    { name: "Hakan Çalhanoğlu", position: "MED" },
    { name: "Kerem Aktürkoğlu", position: "DEL" },
  ],
  KOR: [
    { name: "Son Heung-min", position: "DEL" },
    { name: "Lee Kang-in", position: "MED" },
    { name: "Hwang Hee-chan", position: "DEL" },
  ],
  TUN: [
    { name: "Wahbi Khazri", position: "DEL" },
    { name: "Youssef Msakni", position: "DEL" },
    { name: "Hannibal Mejbri", position: "MED" },
  ],
  SUI: [
    { name: "Granit Xhaka", position: "MED" },
    { name: "Xherdan Shaqiri", position: "MED" },
    { name: "Breel Embolo", position: "DEL" },
  ],
  POL: [
    { name: "Robert Lewandowski", position: "DEL" },
    { name: "Piotr Zieliński", position: "MED" },
    { name: "Sebastian Szymański", position: "MED" },
  ],
  DEN: [
    { name: "Christian Eriksen", position: "MED" },
    { name: "Rasmus Højlund", position: "DEL" },
    { name: "Pierre-Emile Højbjerg", position: "MED" },
  ],
  NOR: [
    { name: "Erling Haaland", position: "DEL" },
    { name: "Martin Ødegaard", position: "MED" },
    { name: "Alexander Sørloth", position: "DEL" },
  ],
  SCO: [
    { name: "Scott McTominay", position: "MED" },
    { name: "Andy Robertson", position: "DEF" },
    { name: "John McGinn", position: "MED" },
  ],
  RSA: [
    { name: "Percy Tau", position: "DEL" },
    { name: "Themba Zwane", position: "MED" },
    { name: "Lyle Foster", position: "DEL" },
  ],
  CZE: [
    { name: "Patrik Schick", position: "DEL" },
    { name: "Tomáš Souček", position: "MED" },
    { name: "Adam Hložek", position: "DEL" },
  ],
  BIH: [
    { name: "Edin Džeko", position: "DEL" },
    { name: "Miralem Pjanić", position: "MED" },
    { name: "Sead Kolašinac", position: "DEF" },
  ],
  QAT: [
    { name: "Almoez Ali", position: "DEL" },
    { name: "Akram Afif", position: "DEL" },
  ],
  HAI: [
    { name: "Duckens Nazon", position: "DEL" },
    { name: "Frantzdy Pierrot", position: "DEL" },
  ],
  CUW: [
    { name: "Leandro Bacuna", position: "MED" },
    { name: "Tahith Chong", position: "DEL" },
  ],
  CIV: [
    { name: "Sébastien Haller", position: "DEL" },
    { name: "Franck Kessié", position: "MED" },
    { name: "Wilfried Zaha", position: "DEL" },
  ],
  SWE: [
    { name: "Alexander Isak", position: "DEL" },
    { name: "Viktor Gyökeres", position: "DEL" },
    { name: "Dejan Kulusevski", position: "DEL" },
  ],
  NZL: [
    { name: "Chris Wood", position: "DEL" },
    { name: "Liberato Cacace", position: "DEF" },
  ],
  CPV: [
    { name: "Ryan Mendes", position: "DEL" },
    { name: "Bebé", position: "DEL" },
  ],
  KSA: [
    { name: "Salem Al-Dawsari", position: "DEL" },
    { name: "Saleh Al-Shehri", position: "DEL" },
  ],
  IRQ: [
    { name: "Aymen Hussein", position: "DEL" },
    { name: "Ali Al-Hamadi", position: "DEL" },
  ],
  ALG: [
    { name: "Riyad Mahrez", position: "DEL" },
    { name: "Ismaël Bennacer", position: "MED" },
    { name: "Houssem Aouar", position: "MED" },
  ],
  AUT: [
    { name: "Marcel Sabitzer", position: "MED" },
    { name: "David Alaba", position: "DEF" },
    { name: "Marko Arnautović", position: "DEL" },
  ],
  JOR: [
    { name: "Musa Al-Taamari", position: "DEL" },
    { name: "Yazan Al-Naimat", position: "DEL" },
  ],
  COD: [
    { name: "Cédric Bakambu", position: "DEL" },
    { name: "Yoane Wissa", position: "DEL" },
  ],
  UZB: [
    { name: "Eldor Shomurodov", position: "DEL" },
    { name: "Abbosbek Fayzullayev", position: "MED" },
  ],
  GHA: [
    { name: "Mohammed Kudus", position: "MED" },
    { name: "Thomas Partey", position: "MED" },
    { name: "Iñaki Williams", position: "DEL" },
  ],
  PAN: [
    { name: "Ismael Díaz", position: "DEL" },
    { name: "José Fajardo", position: "DEL" },
  ],
};

async function seed() {
  console.log("🌱 Seed de players famosos (~150)\n");
  const allTeams = await db.query.teams.findMany();
  const teamByFifa = new Map(allTeams.map((t) => [t.fifaCode, t]));

  let inserted = 0;
  let skipped = 0;
  let apiId = 1;

  for (const [fifaCode, roster] of Object.entries(ROSTER)) {
    const team = teamByFifa.get(fifaCode);
    if (!team) {
      console.warn(`⚠ Team ${fifaCode} no encontrado, skip ${roster.length} players`);
      skipped += roster.length;
      continue;
    }
    for (const p of roster) {
      await db
        .insert(players)
        .values({
          apiSportsPlayerId: apiId++,
          name: p.name,
          teamId: team.id,
          position: p.position,
        })
        .onConflictDoNothing();
      inserted++;
    }
  }
  console.log(`✓ ${inserted} players insertados (${skipped} skipped por team no encontrado)`);
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ Seed players falló:", err);
    process.exit(1);
  });
