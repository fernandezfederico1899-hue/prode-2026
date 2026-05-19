// Mock data para el mockup visual — NO usar en producción.
// Cuando lleguemos a M1 esto viene de Neon + Drizzle.

export type Team = {
  id: string;
  fifaCode: string;
  name: string;
  flagCode: string; // ISO 3166-1 alpha-2 lowercase
  groupLetter: string;
};

export type MatchStage =
  | "group"
  | "round_of_32"
  | "round_of_16"
  | "quarter"
  | "semi"
  | "third_place"
  | "final";

export type MatchStatus =
  | "scheduled"
  | "live"
  | "finished"
  | "postponed"
  | "cancelled";

export type Match = {
  id: string;
  homeTeam: Team;
  awayTeam: Team;
  kickoffAt: Date;
  venue: string;
  stage: MatchStage;
  groupLetter: string | null;
  status: MatchStatus;
  homeScore: number | null;
  awayScore: number | null;
};

export type User = {
  id: string;
  name: string;
  avatarUrl?: string;
  favoriteTeam?: Team;
};

export type Prediction = {
  id: string;
  userId: string;
  matchId: string;
  homeScore: number;
  awayScore: number;
  points: number | null;
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

// ========== TEAMS ==========
// 16 teams = 4 grupos de 4 para el mockup (en producción serán 48 / 12 grupos).
export const teams: Team[] = [
  // Grupo A
  { id: "t-arg", fifaCode: "ARG", name: "Argentina", flagCode: "ar", groupLetter: "A" },
  { id: "t-mex", fifaCode: "MEX", name: "México", flagCode: "mx", groupLetter: "A" },
  { id: "t-mar", fifaCode: "MAR", name: "Marruecos", flagCode: "ma", groupLetter: "A" },
  { id: "t-uru", fifaCode: "URU", name: "Uruguay", flagCode: "uy", groupLetter: "A" },
  // Grupo B
  { id: "t-esp", fifaCode: "ESP", name: "España", flagCode: "es", groupLetter: "B" },
  { id: "t-usa", fifaCode: "USA", name: "Estados Unidos", flagCode: "us", groupLetter: "B" },
  { id: "t-ned", fifaCode: "NED", name: "Países Bajos", flagCode: "nl", groupLetter: "B" },
  { id: "t-sen", fifaCode: "SEN", name: "Senegal", flagCode: "sn", groupLetter: "B" },
  // Grupo C
  { id: "t-bra", fifaCode: "BRA", name: "Brasil", flagCode: "br", groupLetter: "C" },
  { id: "t-eng", fifaCode: "ENG", name: "Inglaterra", flagCode: "gb", groupLetter: "C" },
  { id: "t-jpn", fifaCode: "JPN", name: "Japón", flagCode: "jp", groupLetter: "C" },
  { id: "t-sui", fifaCode: "SUI", name: "Suiza", flagCode: "ch", groupLetter: "C" },
  // Grupo D
  { id: "t-fra", fifaCode: "FRA", name: "Francia", flagCode: "fr", groupLetter: "D" },
  { id: "t-ger", fifaCode: "GER", name: "Alemania", flagCode: "de", groupLetter: "D" },
  { id: "t-por", fifaCode: "POR", name: "Portugal", flagCode: "pt", groupLetter: "D" },
  { id: "t-col", fifaCode: "COL", name: "Colombia", flagCode: "co", groupLetter: "D" },
  // Otros equipos clasificados (grupos E-L). No mostramos sus standings en el
  // mockup pero existen para que el bracket R32 (32 equipos) tenga teams reales.
  { id: "t-cro", fifaCode: "CRO", name: "Croacia", flagCode: "hr", groupLetter: "E" },
  { id: "t-bel", fifaCode: "BEL", name: "Bélgica", flagCode: "be", groupLetter: "E" },
  { id: "t-den", fifaCode: "DEN", name: "Dinamarca", flagCode: "dk", groupLetter: "F" },
  { id: "t-pol", fifaCode: "POL", name: "Polonia", flagCode: "pl", groupLetter: "F" },
  { id: "t-aus", fifaCode: "AUS", name: "Australia", flagCode: "au", groupLetter: "G" },
  { id: "t-sui_alt", fifaCode: "ECU", name: "Ecuador", flagCode: "ec", groupLetter: "G" },
  { id: "t-kor", fifaCode: "KOR", name: "Corea del Sur", flagCode: "kr", groupLetter: "H" },
  { id: "t-irn", fifaCode: "IRN", name: "Irán", flagCode: "ir", groupLetter: "H" },
  { id: "t-can", fifaCode: "CAN", name: "Canadá", flagCode: "ca", groupLetter: "I" },
  { id: "t-tun", fifaCode: "TUN", name: "Túnez", flagCode: "tn", groupLetter: "I" },
  { id: "t-nga", fifaCode: "NGA", name: "Nigeria", flagCode: "ng", groupLetter: "J" },
  { id: "t-egy", fifaCode: "EGY", name: "Egipto", flagCode: "eg", groupLetter: "J" },
  { id: "t-srb", fifaCode: "SRB", name: "Serbia", flagCode: "rs", groupLetter: "K" },
  { id: "t-wal", fifaCode: "WAL", name: "Gales", flagCode: "gb-wls", groupLetter: "K" },
  { id: "t-par", fifaCode: "PAR", name: "Paraguay", flagCode: "py", groupLetter: "L" },
  { id: "t-tur", fifaCode: "TUR", name: "Turquía", flagCode: "tr", groupLetter: "L" },
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

export const matches: Match[] = [
  // ============ GRUPO A ============
  {
    id: "m-1",
    homeTeam: findTeam("ARG"),
    awayTeam: findTeam("URU"),
    kickoffAt: hoursAgo(72),
    venue: "MetLife Stadium, New York",
    stage: "group",
    groupLetter: "A",
    status: "finished",
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: "m-2",
    homeTeam: findTeam("MEX"),
    awayTeam: findTeam("MAR"),
    kickoffAt: hoursAgo(60),
    venue: "Estadio Azteca, México DF",
    stage: "group",
    groupLetter: "A",
    status: "finished",
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: "m-3",
    homeTeam: findTeam("ARG"),
    awayTeam: findTeam("MEX"),
    kickoffAt: hoursFromNow(28),
    venue: "SoFi Stadium, Los Angeles",
    stage: "group",
    groupLetter: "A",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },

  // ============ GRUPO B ============
  {
    id: "m-4",
    homeTeam: findTeam("ESP"),
    awayTeam: findTeam("SEN"),
    kickoffAt: hoursAgo(48),
    venue: "SoFi Stadium, Los Angeles",
    stage: "group",
    groupLetter: "B",
    status: "finished",
    homeScore: 3,
    awayScore: 0,
  },
  {
    id: "m-5",
    homeTeam: findTeam("NED"),
    awayTeam: findTeam("USA"),
    kickoffAt: hoursAgo(36),
    venue: "Lumen Field, Seattle",
    stage: "group",
    groupLetter: "B",
    status: "finished",
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: "m-6",
    homeTeam: findTeam("ESP"),
    awayTeam: findTeam("NED"),
    kickoffAt: hoursFromNow(5),
    venue: "AT&T Stadium, Dallas",
    stage: "group",
    groupLetter: "B",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },

  // ============ GRUPO C ============
  {
    id: "m-7",
    homeTeam: findTeam("BRA"),
    awayTeam: findTeam("SUI"),
    kickoffAt: hoursAgo(24),
    venue: "Hard Rock Stadium, Miami",
    stage: "group",
    groupLetter: "C",
    status: "finished",
    homeScore: 3,
    awayScore: 1,
  },
  {
    id: "m-8",
    homeTeam: findTeam("ENG"),
    awayTeam: findTeam("JPN"),
    kickoffAt: hoursAgo(1),
    venue: "BC Place, Vancouver",
    stage: "group",
    groupLetter: "C",
    status: "live",
    homeScore: 1,
    awayScore: 0,
  },
  {
    id: "m-9",
    homeTeam: findTeam("BRA"),
    awayTeam: findTeam("ENG"),
    kickoffAt: hoursFromNow(50),
    venue: "MetLife Stadium, New York",
    stage: "group",
    groupLetter: "C",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },

  // ============ GRUPO D ============
  {
    id: "m-10",
    homeTeam: findTeam("FRA"),
    awayTeam: findTeam("COL"),
    kickoffAt: hoursAgo(50),
    venue: "Mercedes-Benz Stadium, Atlanta",
    stage: "group",
    groupLetter: "D",
    status: "finished",
    homeScore: 2,
    awayScore: 0,
  },
  {
    id: "m-11",
    homeTeam: findTeam("GER"),
    awayTeam: findTeam("POR"),
    kickoffAt: hoursAgo(12),
    venue: "Levi's Stadium, San Francisco",
    stage: "group",
    groupLetter: "D",
    status: "finished",
    homeScore: 1,
    awayScore: 1,
  },
  {
    id: "m-12",
    homeTeam: findTeam("FRA"),
    awayTeam: findTeam("GER"),
    kickoffAt: hoursFromNow(2),
    venue: "Arrowhead Stadium, Kansas City",
    stage: "group",
    groupLetter: "D",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
];

// ========== PREDICTIONS ==========
// Pronósticos del current user (Federico) — mix de exactos, signos, errados y pendientes.
export const userPredictions: Record<string, Prediction> = {
  "m-1": { id: "p-1", userId: "u-fede", matchId: "m-1", homeScore: 2, awayScore: 1, points: 3 },   // exacto (ARG-URU 2-1)
  "m-2": { id: "p-2", userId: "u-fede", matchId: "m-2", homeScore: 1, awayScore: 0, points: 1 },   // signo (MEX-MAR 2-1)
  "m-3": { id: "p-3", userId: "u-fede", matchId: "m-3", homeScore: 2, awayScore: 1, points: null }, // scheduled
  "m-4": { id: "p-4", userId: "u-fede", matchId: "m-4", homeScore: 2, awayScore: 0, points: 1 },   // signo (ESP-SEN 3-0)
  "m-5": { id: "p-5", userId: "u-fede", matchId: "m-5", homeScore: 1, awayScore: 2, points: 0 },   // errado (NED-USA 2-1)
  "m-6": { id: "p-6", userId: "u-fede", matchId: "m-6", homeScore: 1, awayScore: 1, points: null }, // scheduled
  "m-7": { id: "p-7", userId: "u-fede", matchId: "m-7", homeScore: 3, awayScore: 1, points: 3 },   // exacto (BRA-SUI 3-1)
  "m-8": { id: "p-8", userId: "u-fede", matchId: "m-8", homeScore: 2, awayScore: 1, points: null }, // live
  "m-10": { id: "p-10", userId: "u-fede", matchId: "m-10", homeScore: 3, awayScore: 0, points: 1 }, // signo (FRA-COL 2-0)
  "m-12": { id: "p-12", userId: "u-fede", matchId: "m-12", homeScore: 2, awayScore: 1, points: null }, // scheduled
  // m-9 y m-11 sin cargar (pending)
};

// ========== OTHER USERS PREDICTIONS for match detail view ==========
export const allPredictionsForMatch: Record<string, Array<Prediction & { user: User }>> = {
  "m-1": [
    { id: "pa1", userId: "u-fede", matchId: "m-1", homeScore: 2, awayScore: 1, points: 3, user: users[0] },
    { id: "pa2", userId: "u-manuel", matchId: "m-1", homeScore: 2, awayScore: 0, points: 1, user: users[1] },
    { id: "pa3", userId: "u-juan", matchId: "m-1", homeScore: 1, awayScore: 2, points: 0, user: users[2] },
    { id: "pa4", userId: "u-diego", matchId: "m-1", homeScore: 1, awayScore: 1, points: 0, user: users[3] },
    { id: "pa5", userId: "u-pablo", matchId: "m-1", homeScore: 3, awayScore: 1, points: 1, user: users[4] },
    { id: "pa6", userId: "u-tomas", matchId: "m-1", homeScore: 2, awayScore: 1, points: 3, user: users[5] },
    { id: "pa7", userId: "u-nico", matchId: "m-1", homeScore: 2, awayScore: 2, points: 0, user: users[6] },
    { id: "pa8", userId: "u-mateo", matchId: "m-1", homeScore: 1, awayScore: 0, points: 1, user: users[7] },
  ],
  "m-8": [
    { id: "pl1", userId: "u-fede", matchId: "m-8", homeScore: 2, awayScore: 1, points: null, user: users[0] },
    { id: "pl2", userId: "u-manuel", matchId: "m-8", homeScore: 1, awayScore: 0, points: null, user: users[1] },
    { id: "pl3", userId: "u-juan", matchId: "m-8", homeScore: 3, awayScore: 1, points: null, user: users[2] },
    { id: "pl4", userId: "u-diego", matchId: "m-8", homeScore: 1, awayScore: 1, points: null, user: users[3] },
    { id: "pl5", userId: "u-tomas", matchId: "m-8", homeScore: 2, awayScore: 0, points: null, user: users[5] },
    { id: "pl6", userId: "u-mateo", matchId: "m-8", homeScore: 0, awayScore: 1, points: null, user: users[7] },
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
