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
];

const findTeam = (code: string) => teams.find((t) => t.fifaCode === code)!;

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
  {
    id: "m-1",
    homeTeam: findTeam("ARG"),
    awayTeam: findTeam("URU"),
    kickoffAt: hoursAgo(48),
    venue: "MetLife Stadium, New York",
    stage: "group",
    groupLetter: "A",
    status: "finished",
    homeScore: 2,
    awayScore: 1,
  },
  {
    id: "m-2",
    homeTeam: findTeam("ESP"),
    awayTeam: findTeam("USA"),
    kickoffAt: hoursAgo(36),
    venue: "SoFi Stadium, Los Angeles",
    stage: "group",
    groupLetter: "B",
    status: "finished",
    homeScore: 3,
    awayScore: 0,
  },
  {
    id: "m-3",
    homeTeam: findTeam("BRA"),
    awayTeam: findTeam("MEX"),
    kickoffAt: hoursAgo(24),
    venue: "Estadio Azteca, México DF",
    stage: "group",
    groupLetter: "C",
    status: "finished",
    homeScore: 1,
    awayScore: 1,
  },
  {
    id: "m-4",
    homeTeam: findTeam("FRA"),
    awayTeam: findTeam("MAR"),
    kickoffAt: hoursAgo(1),
    venue: "Lumen Field, Seattle",
    stage: "group",
    groupLetter: "D",
    status: "live",
    homeScore: 1,
    awayScore: 0,
  },
  {
    id: "m-5",
    homeTeam: findTeam("GER"),
    awayTeam: findTeam("JPN"),
    kickoffAt: hoursFromNow(2),
    venue: "Hard Rock Stadium, Miami",
    stage: "group",
    groupLetter: "E",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
  {
    id: "m-6",
    homeTeam: findTeam("ENG"),
    awayTeam: findTeam("POR"),
    kickoffAt: hoursFromNow(5),
    venue: "AT&T Stadium, Dallas",
    stage: "group",
    groupLetter: "F",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
  {
    id: "m-7",
    homeTeam: findTeam("ARG"),
    awayTeam: findTeam("BRA"),
    kickoffAt: hoursFromNow(28),
    venue: "MetLife Stadium, New York",
    stage: "group",
    groupLetter: "A",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
  {
    id: "m-8",
    homeTeam: findTeam("FRA"),
    awayTeam: findTeam("ESP"),
    kickoffAt: hoursFromNow(50),
    venue: "BC Place, Vancouver",
    stage: "group",
    groupLetter: "D",
    status: "scheduled",
    homeScore: null,
    awayScore: null,
  },
];

// ========== PREDICTIONS ==========
// Predicciones del current user para algunos partidos (mostrar la variedad de estados).
export const userPredictions: Record<string, Prediction> = {
  "m-1": { id: "p-1", userId: "u-fede", matchId: "m-1", homeScore: 2, awayScore: 1, points: 3 }, // exacto
  "m-2": { id: "p-2", userId: "u-fede", matchId: "m-2", homeScore: 2, awayScore: 0, points: 1 }, // signo
  "m-3": { id: "p-3", userId: "u-fede", matchId: "m-3", homeScore: 2, awayScore: 1, points: 0 }, // erró (terminó 1-1)
  "m-4": { id: "p-4", userId: "u-fede", matchId: "m-4", homeScore: 2, awayScore: 1, points: null }, // en vivo
  "m-5": { id: "p-5", userId: "u-fede", matchId: "m-5", homeScore: 1, awayScore: 2, points: null },
  "m-6": { id: "p-6", userId: "u-fede", matchId: "m-6", homeScore: 1, awayScore: 1, points: null },
  // m-7 y m-8 sin cargar (pending)
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
  "m-4": [
    { id: "pl1", userId: "u-fede", matchId: "m-4", homeScore: 2, awayScore: 1, points: null, user: users[0] },
    { id: "pl2", userId: "u-manuel", matchId: "m-4", homeScore: 1, awayScore: 0, points: null, user: users[1] },
    { id: "pl3", userId: "u-juan", matchId: "m-4", homeScore: 3, awayScore: 1, points: null, user: users[2] },
    { id: "pl4", userId: "u-diego", matchId: "m-4", homeScore: 1, awayScore: 1, points: null, user: users[3] },
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

// ========== TOURNAMENT CONFIG ==========
export const tournamentConfig = {
  pozoAmountArs: 20000,
  tournamentStartsAt: new Date("2026-06-11T12:00:00.000-03:00"),
  paidCount: 8,
  totalCount: 10,
};
