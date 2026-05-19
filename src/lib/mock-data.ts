// Mock data — usado por las páginas que todavía no migramos a queries reales.
// En M1.3 vamos reemplazando esto progresivamente; mock-data va a quedar
// solo para páginas legacy (bracket, champion, admin parcial).

import type {
  Match,
  MatchStage,
  MatchStatus,
  MatchWithTeams,
  Prediction,
  Team,
} from "@/lib/types";

export type { Match, MatchStage, MatchStatus, MatchWithTeams, Prediction, Team };

export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
  favoriteTeam?: Team;
};

export type LeaderboardEntry = {
  user: User;
  rank: number;
  isTied: boolean;
  totalPoints: number;
  exactCount: number;
  signCount: number;
  wrongCount: number;
  hasPaid: boolean;
};

// ========== Helpers para enriquecer mocks a tipos completos ==========
const team = (
  id: string,
  fifaCode: string,
  name: string,
  flagCode: string,
  groupLetter: string,
): Team => ({
  id,
  fifaCode,
  name,
  flagCode,
  openfootballName: name,
  apiSportsId: null,
  groupLetter,
});

const NOW = new Date();

const match = (
  id: string,
  homeTeam: Team,
  awayTeam: Team,
  kickoffAt: Date,
  venue: string,
  stage: MatchStage,
  groupLetter: string | null,
  status: MatchStatus,
  homeScore: number | null,
  awayScore: number | null,
): MatchWithTeams => ({
  id,
  openfootballMatchId: null,
  apiSportsFixtureId: null,
  homeTeamId: homeTeam.id,
  awayTeamId: awayTeam.id,
  homeTeam,
  awayTeam,
  kickoffAt,
  venue,
  stage,
  groupLetter,
  status,
  homeScore,
  awayScore,
  finishedAt: status === "finished" ? kickoffAt : null,
  lastSyncedAt: null,
  createdAt: NOW,
  updatedAt: NOW,
});

const prediction = (
  id: string,
  userId: string,
  matchId: string,
  homeScore: number,
  awayScore: number,
  points: number | null,
): Prediction => ({
  id,
  userId,
  matchId,
  homeScore,
  awayScore,
  points,
  createdAt: NOW,
  updatedAt: NOW,
});

// ========== TEAMS ==========
export const teams: Team[] = [
  // Grupo A
  team("t-arg", "ARG", "Argentina", "ar", "A"),
  team("t-mex", "MEX", "México", "mx", "A"),
  team("t-mar", "MAR", "Marruecos", "ma", "A"),
  team("t-uru", "URU", "Uruguay", "uy", "A"),
  // Grupo B
  team("t-esp", "ESP", "España", "es", "B"),
  team("t-usa", "USA", "Estados Unidos", "us", "B"),
  team("t-ned", "NED", "Países Bajos", "nl", "B"),
  team("t-sen", "SEN", "Senegal", "sn", "B"),
  // Grupo C
  team("t-bra", "BRA", "Brasil", "br", "C"),
  team("t-eng", "ENG", "Inglaterra", "gb", "C"),
  team("t-jpn", "JPN", "Japón", "jp", "C"),
  team("t-sui", "SUI", "Suiza", "ch", "C"),
  // Grupo D
  team("t-fra", "FRA", "Francia", "fr", "D"),
  team("t-ger", "GER", "Alemania", "de", "D"),
  team("t-por", "POR", "Portugal", "pt", "D"),
  team("t-col", "COL", "Colombia", "co", "D"),
  // Otros equipos clasificados (grupos E-L). No mostramos sus standings en el
  // mockup pero existen para que el bracket R32 (32 equipos) tenga teams reales.
  team("t-cro", "CRO", "Croacia", "hr", "E"),
  team("t-bel", "BEL", "Bélgica", "be", "E"),
  team("t-den", "DEN", "Dinamarca", "dk", "F"),
  team("t-pol", "POL", "Polonia", "pl", "F"),
  team("t-aus", "AUS", "Australia", "au", "G"),
  team("t-sui_alt", "ECU", "Ecuador", "ec", "G"),
  team("t-kor", "KOR", "Corea del Sur", "kr", "H"),
  team("t-irn", "IRN", "Irán", "ir", "H"),
  team("t-can", "CAN", "Canadá", "ca", "I"),
  team("t-tun", "TUN", "Túnez", "tn", "I"),
  team("t-nga", "NGA", "Nigeria", "ng", "J"),
  team("t-egy", "EGY", "Egipto", "eg", "J"),
  team("t-srb", "SRB", "Serbia", "rs", "K"),
  team("t-wal", "WAL", "Gales", "gb-wls", "K"),
  team("t-par", "PAR", "Paraguay", "py", "L"),
  team("t-tur", "TUR", "Turquía", "tr", "L"),
];

const findTeam = (code: string) => teams.find((t) => t.fifaCode === code)!;

// ========== PLAYERS ==========
// Para pronósticos de goleador y mejor jugador.
// En producción se precargan ~700 desde API-Sports.
export type Player = {
  id: string;
  name: string;
  teamId: string;
  position: string;
};

export const players: Player[] = [
  { id: "p-messi", name: "Lionel Messi", teamId: "t-arg", position: "DEL" },
  { id: "p-lautaro", name: "Lautaro Martínez", teamId: "t-arg", position: "DEL" },
  { id: "p-mbappe", name: "Kylian Mbappé", teamId: "t-fra", position: "DEL" },
  { id: "p-vinicius", name: "Vinícius Júnior", teamId: "t-bra", position: "DEL" },
  { id: "p-rodrygo", name: "Rodrygo", teamId: "t-bra", position: "DEL" },
  { id: "p-haaland", name: "Erling Haaland", teamId: "t-ger", position: "DEL" },
  { id: "p-musiala", name: "Jamal Musiala", teamId: "t-ger", position: "MED" },
  { id: "p-bellingham", name: "Jude Bellingham", teamId: "t-eng", position: "MED" },
  { id: "p-kane", name: "Harry Kane", teamId: "t-eng", position: "DEL" },
  { id: "p-yamal", name: "Lamine Yamal", teamId: "t-esp", position: "DEL" },
  { id: "p-pedri", name: "Pedri", teamId: "t-esp", position: "MED" },
  { id: "p-ronaldo", name: "Cristiano Ronaldo", teamId: "t-por", position: "DEL" },
  { id: "p-leao", name: "Rafael Leão", teamId: "t-por", position: "DEL" },
  { id: "p-depay", name: "Memphis Depay", teamId: "t-ned", position: "DEL" },
  { id: "p-kudus", name: "Mohammed Kudus", teamId: "t-mar", position: "DEL" }, // (Kudus es ghanés en realidad pero es mock)
  { id: "p-lozano", name: "Hirving Lozano", teamId: "t-mex", position: "DEL" },
  { id: "p-pulisic", name: "Christian Pulisic", teamId: "t-usa", position: "MED" },
  { id: "p-mane", name: "Sadio Mané", teamId: "t-sen", position: "DEL" },
  { id: "p-mitoma", name: "Kaoru Mitoma", teamId: "t-jpn", position: "DEL" },
  { id: "p-james", name: "James Rodríguez", teamId: "t-col", position: "MED" },
  { id: "p-ziyech", name: "Hakim Ziyech", teamId: "t-mar", position: "MED" },
  { id: "p-suarez", name: "Luis Suárez", teamId: "t-uru", position: "DEL" },
];

// ========== USERS ==========
export const users: User[] = [
  { id: "u-fede", name: "Federico", favoriteTeam: findTeam("ARG") },
  { id: "u-manuel", name: "Manuel", favoriteTeam: findTeam("ARG") },
  { id: "u-juan", name: "Juan", favoriteTeam: findTeam("BRA") },
  { id: "u-diego", name: "Diego", favoriteTeam: findTeam("URU") },
  { id: "u-pablo", name: "Pablo", favoriteTeam: findTeam("ARG") },
  { id: "u-tomas", name: "Tomás", favoriteTeam: findTeam("ESP") },
  { id: "u-nico", name: "Nicolás", favoriteTeam: findTeam("ARG") },
  { id: "u-mateo", name: "Mateo", favoriteTeam: findTeam("FRA") },
  { id: "u-bruno", name: "Bruno", favoriteTeam: findTeam("ARG") },
  { id: "u-santi", name: "Santiago", favoriteTeam: findTeam("ARG") },
];

export const currentUser = users[0]; // "Federico" como user logueado del mockup

// ========== MATCHES ==========
// Mezcla de partidos finalizados, en vivo y futuros para mostrar todos los estados visuales.
const now = new Date("2026-06-15T18:00:00.000-03:00");
const hoursAgo = (h: number) => new Date(now.getTime() - h * 60 * 60 * 1000);
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 60 * 60 * 1000);

export const matches: MatchWithTeams[] = [
  // Grupo A
  match("m-1", findTeam("ARG"), findTeam("URU"), hoursAgo(72), "MetLife Stadium, New York", "group", "A", "finished", 2, 1),
  match("m-2", findTeam("MEX"), findTeam("MAR"), hoursAgo(60), "Estadio Azteca, México DF", "group", "A", "finished", 2, 1),
  match("m-3", findTeam("ARG"), findTeam("MEX"), hoursFromNow(28), "SoFi Stadium, Los Angeles", "group", "A", "scheduled", null, null),
  // Grupo B
  match("m-4", findTeam("ESP"), findTeam("SEN"), hoursAgo(48), "SoFi Stadium, Los Angeles", "group", "B", "finished", 3, 0),
  match("m-5", findTeam("NED"), findTeam("USA"), hoursAgo(36), "Lumen Field, Seattle", "group", "B", "finished", 2, 1),
  match("m-6", findTeam("ESP"), findTeam("NED"), hoursFromNow(5), "AT&T Stadium, Dallas", "group", "B", "scheduled", null, null),
  // Grupo C
  match("m-7", findTeam("BRA"), findTeam("SUI"), hoursAgo(24), "Hard Rock Stadium, Miami", "group", "C", "finished", 3, 1),
  match("m-8", findTeam("ENG"), findTeam("JPN"), hoursAgo(1), "BC Place, Vancouver", "group", "C", "live", 1, 0),
  match("m-9", findTeam("BRA"), findTeam("ENG"), hoursFromNow(50), "MetLife Stadium, New York", "group", "C", "scheduled", null, null),
  // Grupo D
  match("m-10", findTeam("FRA"), findTeam("COL"), hoursAgo(50), "Mercedes-Benz Stadium, Atlanta", "group", "D", "finished", 2, 0),
  match("m-11", findTeam("GER"), findTeam("POR"), hoursAgo(12), "Levi's Stadium, San Francisco", "group", "D", "finished", 1, 1),
  match("m-12", findTeam("FRA"), findTeam("GER"), hoursFromNow(2), "Arrowhead Stadium, Kansas City", "group", "D", "scheduled", null, null),
];

// ========== PREDICTIONS ==========
// Pronósticos del current user (Federico) — mix de exactos, signos, errados y pendientes.
export const userPredictions: Record<string, Prediction> = {
  "m-1": prediction("p-1", "u-fede", "m-1", 2, 1, 3),     // exacto (ARG-URU 2-1)
  "m-2": prediction("p-2", "u-fede", "m-2", 1, 0, 1),     // signo (MEX-MAR 2-1)
  "m-3": prediction("p-3", "u-fede", "m-3", 2, 1, null),  // scheduled
  "m-4": prediction("p-4", "u-fede", "m-4", 2, 0, 1),     // signo (ESP-SEN 3-0)
  "m-5": prediction("p-5", "u-fede", "m-5", 1, 2, 0),     // errado (NED-USA 2-1)
  "m-6": prediction("p-6", "u-fede", "m-6", 1, 1, null),  // scheduled
  "m-7": prediction("p-7", "u-fede", "m-7", 3, 1, 3),     // exacto (BRA-SUI 3-1)
  "m-8": prediction("p-8", "u-fede", "m-8", 2, 1, null),  // live
  "m-10": prediction("p-10", "u-fede", "m-10", 3, 0, 1),  // signo (FRA-COL 2-0)
  "m-12": prediction("p-12", "u-fede", "m-12", 2, 1, null), // scheduled
};

// ========== OTHER USERS PREDICTIONS for match detail view ==========
export const allPredictionsForMatch: Record<string, Array<Prediction & { user: User }>> = {
  "m-1": [
    { ...prediction("pa1", "u-fede", "m-1", 2, 1, 3), user: users[0] },
    { ...prediction("pa2", "u-manuel", "m-1", 2, 0, 1), user: users[1] },
    { ...prediction("pa3", "u-juan", "m-1", 1, 2, 0), user: users[2] },
    { ...prediction("pa4", "u-diego", "m-1", 1, 1, 0), user: users[3] },
    { ...prediction("pa5", "u-pablo", "m-1", 3, 1, 1), user: users[4] },
    { ...prediction("pa6", "u-tomas", "m-1", 2, 1, 3), user: users[5] },
    { ...prediction("pa7", "u-nico", "m-1", 2, 2, 0), user: users[6] },
    { ...prediction("pa8", "u-mateo", "m-1", 1, 0, 1), user: users[7] },
  ],
  "m-8": [
    { ...prediction("pl1", "u-fede", "m-8", 2, 1, null), user: users[0] },
    { ...prediction("pl2", "u-manuel", "m-8", 1, 0, null), user: users[1] },
    { ...prediction("pl3", "u-juan", "m-8", 3, 1, null), user: users[2] },
    { ...prediction("pl4", "u-diego", "m-8", 1, 1, null), user: users[3] },
    { ...prediction("pl5", "u-tomas", "m-8", 2, 0, null), user: users[5] },
    { ...prediction("pl6", "u-mateo", "m-8", 0, 1, null), user: users[7] },
  ],
};

// ========== LEADERBOARD ==========
export const leaderboard: LeaderboardEntry[] = [
  { user: users[0], rank: 1, isTied: false, totalPoints: 7, exactCount: 2, signCount: 1, wrongCount: 1, hasPaid: true },
  { user: users[5], rank: 2, isTied: false, totalPoints: 6, exactCount: 1, signCount: 3, wrongCount: 0, hasPaid: true },
  { user: users[1], rank: 3, isTied: true, totalPoints: 4, exactCount: 1, signCount: 1, wrongCount: 2, hasPaid: true },
  { user: users[2], rank: 3, isTied: true, totalPoints: 4, exactCount: 1, signCount: 1, wrongCount: 2, hasPaid: false },
  { user: users[7], rank: 5, isTied: false, totalPoints: 3, exactCount: 0, signCount: 3, wrongCount: 1, hasPaid: true },
  { user: users[3], rank: 6, isTied: false, totalPoints: 2, exactCount: 0, signCount: 2, wrongCount: 2, hasPaid: true },
  { user: users[6], rank: 7, isTied: true, totalPoints: 1, exactCount: 0, signCount: 1, wrongCount: 3, hasPaid: false },
  { user: users[8], rank: 7, isTied: true, totalPoints: 1, exactCount: 0, signCount: 1, wrongCount: 3, hasPaid: true },
  { user: users[4], rank: 9, isTied: false, totalPoints: 0, exactCount: 0, signCount: 0, wrongCount: 4, hasPaid: true },
  { user: users[9], rank: 10, isTied: false, totalPoints: 0, exactCount: 0, signCount: 0, wrongCount: 4, hasPaid: true },
];

// ========== GROUP STANDINGS ==========
// Stats agregadas por equipo dentro de su grupo (mockeadas).
export type GroupStanding = {
  team: Team;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
};

const stand = (
  fifaCode: string,
  played: number,
  wins: number,
  draws: number,
  losses: number,
  goalsFor: number,
  goalsAgainst: number,
): GroupStanding => ({
  team: findTeam(fifaCode),
  played,
  wins,
  draws,
  losses,
  goalsFor,
  goalsAgainst,
  points: wins * 3 + draws,
});

export const groupStandings: Record<string, GroupStanding[]> = {
  A: [
    stand("ARG", 3, 2, 1, 0, 5, 2),
    stand("MEX", 3, 2, 0, 1, 4, 3),
    stand("MAR", 3, 1, 0, 2, 3, 4),
    stand("URU", 3, 0, 1, 2, 2, 5),
  ],
  B: [
    stand("ESP", 3, 3, 0, 0, 7, 1),
    stand("NED", 3, 2, 0, 1, 4, 2),
    stand("USA", 3, 1, 0, 2, 2, 5),
    stand("SEN", 3, 0, 0, 3, 1, 6),
  ],
  C: [
    stand("BRA", 3, 2, 1, 0, 6, 2),
    stand("ENG", 3, 2, 0, 1, 5, 3),
    stand("JPN", 3, 0, 2, 1, 2, 3),
    stand("SUI", 3, 0, 1, 2, 1, 6),
  ],
  D: [
    stand("FRA", 3, 2, 1, 0, 5, 2),
    stand("GER", 3, 2, 0, 1, 4, 3),
    stand("POR", 3, 1, 1, 1, 3, 3),
    stand("COL", 3, 0, 0, 3, 1, 5),
  ],
};

// ========== SPECIAL PREDICTIONS ==========
// Pronósticos pre-torneo del current user. Se lockean al primer kickoff.
export type SpecialPicks = {
  championTeamId: string | null;
  runnerUpTeamId: string | null;
  thirdPlaceTeamId: string | null;
  topScorerPlayerId: string | null;
  bestPlayerId: string | null;
  mostGoalsTeamId: string | null;
};

export const currentUserSpecialPicks: SpecialPicks = {
  championTeamId: "t-arg",
  runnerUpTeamId: "t-fra",
  thirdPlaceTeamId: "t-bra",
  topScorerPlayerId: "p-messi",
  bestPlayerId: "p-yamal",
  mostGoalsTeamId: "t-arg",
};

export const SPECIAL_BONUSES = {
  champion: { label: "Campeón", points: 20 },
  runnerUp: { label: "Subcampeón", points: 10 },
  thirdPlace: { label: "Tercer puesto", points: 5 },
  topScorer: { label: "Goleador (Bota de Oro)", points: 15 },
  bestPlayer: { label: "Mejor jugador (Balón de Oro)", points: 10 },
  mostGoals: { label: "País más goleador", points: 5 },
} as const;

// ========== ADMIN — Pending users ==========
// Usuarios que se loguearon con Google y esperan aprobación.
export type PendingUser = {
  id: string;
  email: string;
  name: string;
  requestedAt: Date;
};

export const pendingUsers: PendingUser[] = [
  {
    id: "u-pending-1",
    email: "carlos.benitez@gmail.com",
    name: "Carlos Benítez",
    requestedAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
  },
  {
    id: "u-pending-2",
    email: "martin.fernandez@gmail.com",
    name: "Martín Fernández",
    requestedAt: new Date(now.getTime() - 5 * 60 * 60 * 1000),
  },
  {
    id: "u-pending-3",
    email: "rodrigo.gomez@gmail.com",
    name: "Rodrigo Gómez",
    requestedAt: new Date(now.getTime() - 26 * 60 * 60 * 1000),
  },
];

// ========== ADMIN — Audit log entries ==========
export type AuditEntry = {
  id: string;
  adminEmail: string;
  action: string;
  target: string;
  createdAt: Date;
};

export const auditLog: AuditEntry[] = [
  {
    id: "a-1",
    adminEmail: "fernandezfederico1899@gmail.com",
    action: "approve_user",
    target: "Manuel (manuel@gmail.com)",
    createdAt: new Date(now.getTime() - 30 * 60 * 1000),
  },
  {
    id: "a-2",
    adminEmail: "fernandezfederico1899@gmail.com",
    action: "correct_score",
    target: "Brasil 3-1 Suiza (era 2-1)",
    createdAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
  },
  {
    id: "a-3",
    adminEmail: "fernandezfederico1899@gmail.com",
    action: "mark_payment",
    target: "Diego — pagó",
    createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
  },
];

// ========== ADMIN — API-Sports usage ==========
export const apiSportsUsage = {
  todayCount: 47,
  dailyLimit: 100,
  lastSyncAt: new Date(now.getTime() - 2 * 60 * 1000),
  lastError: null as string | null,
};

// ========== BRACKET (Eliminatoria) ==========
// Mundial 2026 con 48 equipos tiene 5 fases eliminatorias:
//   16avos (16 partidos / 32 equipos) → Octavos (8 / 16) → Cuartos (4 / 8)
//   → Semis (2 / 4) → 3° + Final (1 + 1)
// Total: 32 partidos KO.
// El nombre en español va por la cantidad de PARTIDOS de la ronda (no equipos).
// El enum interno usa convención inglesa (round_of_32 = 32 equipos = 16 partidos).
export type BracketStage =
  | "round_of_32"
  | "round_of_16"
  | "quarter"
  | "semi"
  | "third_place"
  | "final";

export type BracketMatch = {
  id: string;
  stage: BracketStage;
  position: number; // posición vertical dentro de la columna
  team1: Team | null;
  team2: Team | null;
  team1Score: number | null;
  team2Score: number | null;
  winnerId: string | null;
  kickoffAt: Date;
  status: MatchStatus;
};

const bMatch = (
  id: string,
  stage: BracketStage,
  position: number,
  team1Code: string | null,
  team2Code: string | null,
  team1Score: number | null,
  team2Score: number | null,
  status: MatchStatus,
  hoursOffset: number,
): BracketMatch => {
  const t1 = team1Code ? findTeam(team1Code) : null;
  const t2 = team2Code ? findTeam(team2Code) : null;
  let winnerId: string | null = null;
  if (status === "finished" && t1 && t2 && team1Score !== null && team2Score !== null) {
    winnerId = team1Score > team2Score ? t1.id : t2.id;
  }
  return {
    id,
    stage,
    position,
    team1: t1,
    team2: t2,
    team1Score,
    team2Score,
    winnerId,
    kickoffAt: new Date(now.getTime() + hoursOffset * 60 * 60 * 1000),
    status,
  };
};

export const bracket: BracketMatch[] = [
  // ========== 16AVOS (16 partidos / 32 equipos) ==========
  // Primeros 8 ya jugados (con mis 16 teams mockeados). Los siguientes 8 con TBD.
  bMatch("b-r32-1",  "round_of_32",  1, "ARG", "MAR", 2, 1, "finished", -240),
  bMatch("b-r32-2",  "round_of_32",  2, "ENG", "SUI", 1, 0, "finished", -238),
  bMatch("b-r32-3",  "round_of_32",  3, "BRA", "SEN", 3, 0, "finished", -236),
  bMatch("b-r32-4",  "round_of_32",  4, "URU", "JPN", 2, 1, "finished", -234),
  bMatch("b-r32-5",  "round_of_32",  5, "ESP", "MEX", 2, 0, "finished", -232),
  bMatch("b-r32-6",  "round_of_32",  6, "NED", "COL", 3, 1, "finished", -230),
  bMatch("b-r32-7",  "round_of_32",  7, "FRA", "USA", 2, 1, "finished", -228),
  bMatch("b-r32-8",  "round_of_32",  8, "GER", "POR", 1, 0, "finished", -226),
  // Resto de R32 con teams reales (algunos finalizados, uno EN VIVO, otros próximos)
  bMatch("b-r32-9",  "round_of_32",  9, "CRO", "DEN", 2, 0, "finished", -224),
  bMatch("b-r32-10", "round_of_32", 10, "BEL", "POL", 1, 1, "live", -1),
  bMatch("b-r32-11", "round_of_32", 11, "AUS", "ECU", null, null, "scheduled", 6),
  bMatch("b-r32-12", "round_of_32", 12, "KOR", "IRN", null, null, "scheduled", 10),
  bMatch("b-r32-13", "round_of_32", 13, "CAN", "TUN", null, null, "scheduled", 14),
  bMatch("b-r32-14", "round_of_32", 14, "NGA", "EGY", null, null, "scheduled", 18),
  bMatch("b-r32-15", "round_of_32", 15, "SRB", "WAL", null, null, "scheduled", 22),
  bMatch("b-r32-16", "round_of_32", 16, "PAR", "TUR", null, null, "scheduled", 26),

  // ========== OCTAVOS (8 partidos) ==========
  // R16-1 (ARG vs ENG) ya jugado. R16-2 a R16-4 con teams conocidos (ganadores
  // de R32 finalizados). R16-5 a R16-8 todos TBD.
  bMatch("b-r16-1", "round_of_16", 1, "ARG", "ENG", 2, 1, "finished", -120),
  bMatch("b-r16-2", "round_of_16", 2, "BRA", "URU", null, null, "scheduled", 36),
  bMatch("b-r16-3", "round_of_16", 3, "ESP", "NED", null, null, "scheduled", 40),
  bMatch("b-r16-4", "round_of_16", 4, "FRA", "GER", null, null, "scheduled", 44),
  bMatch("b-r16-5", "round_of_16", 5, null, null, null, null, "scheduled", 48),
  bMatch("b-r16-6", "round_of_16", 6, null, null, null, null, "scheduled", 52),
  bMatch("b-r16-7", "round_of_16", 7, null, null, null, null, "scheduled", 56),
  bMatch("b-r16-8", "round_of_16", 8, null, null, null, null, "scheduled", 60),

  // ========== CUARTOS (4 partidos) ==========
  bMatch("b-qf-1", "quarter", 1, "ARG", null, null, null, "scheduled", 96),
  bMatch("b-qf-2", "quarter", 2, null, null, null, null, "scheduled", 100),
  bMatch("b-qf-3", "quarter", 3, null, null, null, null, "scheduled", 120),
  bMatch("b-qf-4", "quarter", 4, null, null, null, null, "scheduled", 124),

  // ========== SEMIS (2 partidos) ==========
  bMatch("b-sf-1", "semi", 1, null, null, null, null, "scheduled", 168),
  bMatch("b-sf-2", "semi", 2, null, null, null, null, "scheduled", 172),

  // ========== 3ER PUESTO ==========
  bMatch("b-3rd", "third_place", 1, null, null, null, null, "scheduled", 216),

  // ========== FINAL ==========
  bMatch("b-final", "final", 1, null, null, null, null, "scheduled", 220),
];

// ========== TOURNAMENT CONFIG ==========
export const tournamentConfig = {
  pozoAmountArs: 20000,
  tournamentStartsAt: new Date("2026-06-11T12:00:00.000-03:00"),
  paidCount: 8,
  totalCount: 10,
};
