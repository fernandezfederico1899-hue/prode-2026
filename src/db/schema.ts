import { relations, sql } from "drizzle-orm";
import {
  boolean,
  char,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

// ============================================================
// Enums
// ============================================================

export const userStatus = pgEnum("user_status", [
  "pending",
  "approved",
  "rejected",
]);

export const matchStage = pgEnum("match_stage", [
  "group",
  "round_of_32",
  "round_of_16",
  "quarter",
  "semi",
  "third_place",
  "final",
]);

export const matchStatus = pgEnum("match_status", [
  "scheduled",
  "live",
  "finished",
  "postponed",
  "cancelled",
]);

export const notificationKind = pgEnum("notification_kind", [
  "reminder_1h",
  "round_summary",
  "tournament_end",
  "approval_status",
]);

// ============================================================
// users
// ============================================================

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull().unique(),
    emailVerified: timestamp("email_verified", { withTimezone: true }),
    name: text("name").notNull(),
    image: text("image"), // antes avatar_url. Renombrado a `image` para que matchee con Auth.js
    favoriteTeamId: uuid("favorite_team_id"),
    status: userStatus("status").notNull().default("pending"),
    emailOptOut: boolean("email_opt_out").notNull().default(false),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    approvedByEmail: text("approved_by_email"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("users_email_idx").on(t.email),
    index("users_status_idx").on(t.status),
  ],
);

// ============================================================
// Auth.js v5 — tablas que requiere @auth/drizzle-adapter
// ============================================================

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("accounts_user_idx").on(t.userId),
  ],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date", withTimezone: true }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ============================================================
// teams
// ============================================================

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    fifaCode: text("fifa_code").notNull().unique(), // 'ARG', 'BRA'
    name: text("name").notNull(),
    flagCode: text("flag_code").notNull(), // ISO 3166-1 alpha-2 lowercase: 'ar', 'br'
    openfootballName: text("openfootball_name").notNull(),
    apiSportsId: integer("api_sports_id").unique(),
    rosterSyncedAt: timestamp("roster_synced_at", { withTimezone: true }),
    groupLetter: char("group_letter", { length: 1 }), // 'A'..'L'
  },
  (t) => [
    index("teams_fifa_code_idx").on(t.fifaCode),
    index("teams_api_sports_id_idx").on(t.apiSportsId),
    index("teams_group_letter_idx").on(t.groupLetter),
  ],
);

// ============================================================
// players
// ============================================================

export const players = pgTable(
  "players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    apiSportsPlayerId: integer("api_sports_player_id").notNull().unique(),
    name: text("name").notNull(),
    teamId: uuid("team_id")
      .references(() => teams.id, { onDelete: "cascade" })
      .notNull(),
    position: text("position"),
    photoUrl: text("photo_url"),
    shirtNumber: smallint("shirt_number"),
    age: smallint("age"),
  },
  (t) => [
    index("players_name_idx").on(t.name),
    index("players_team_idx").on(t.teamId),
  ],
);

// ============================================================
// matches
// ============================================================

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    openfootballMatchId: text("openfootball_match_id").unique(),
    apiSportsFixtureId: integer("api_sports_fixture_id").unique(),
    // En partidos de KO antes de definir cruces, los teams son nullable y se
    // representan con slots ("1A", "2B", "3A/B/C/D/F") hasta que se resuelven.
    homeTeamId: uuid("home_team_id").references(() => teams.id),
    awayTeamId: uuid("away_team_id").references(() => teams.id),
    homeSlot: text("home_slot"),
    awaySlot: text("away_slot"),
    // Para KO post-R32: de qué match KO anterior viene el equipo y si es
    // el ganador (W) o perdedor (L = solo para 3er puesto).
    homeSourceMatchNum: smallint("home_source_match_num"),
    awaySourceMatchNum: smallint("away_source_match_num"),
    homeSourceOutcome: text("home_source_outcome"), // 'W' | 'L'
    awaySourceOutcome: text("away_source_outcome"),
    // Número del match en openfootball (73-104 para los KO).
    matchNum: smallint("match_num"),
    kickoffAt: timestamp("kickoff_at", { withTimezone: true }).notNull(),
    venue: text("venue"),
    stage: matchStage("stage").notNull(),
    groupLetter: char("group_letter", { length: 1 }),
    status: matchStatus("status").notNull().default("scheduled"),
    homeScore: smallint("home_score"),
    awayScore: smallint("away_score"),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("matches_kickoff_idx").on(t.kickoffAt),
    index("matches_status_kickoff_idx").on(t.status, t.kickoffAt),
    index("matches_stage_idx").on(t.stage),
    check(
      "matches_score_check",
      sql`(${t.homeScore} IS NULL AND ${t.awayScore} IS NULL) OR (${t.homeScore} BETWEEN 0 AND 99 AND ${t.awayScore} BETWEEN 0 AND 99)`,
    ),
    check("matches_different_teams_check", sql`${t.homeTeamId} <> ${t.awayTeamId}`),
  ],
);

// ============================================================
// predictions
// ============================================================

export const predictions = pgTable(
  "predictions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    matchId: uuid("match_id")
      .references(() => matches.id, { onDelete: "cascade" })
      .notNull(),
    homeScore: smallint("home_score").notNull(),
    awayScore: smallint("away_score").notNull(),
    points: smallint("points"), // null = aún no calculado
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    unique("predictions_user_match_unique").on(t.userId, t.matchId),
    index("predictions_match_idx").on(t.matchId),
    index("predictions_user_idx").on(t.userId),
    check(
      "predictions_score_check",
      sql`${t.homeScore} BETWEEN 0 AND 15 AND ${t.awayScore} BETWEEN 0 AND 15`,
    ),
  ],
);

// ============================================================
// special_predictions
// ============================================================

export const specialPredictions = pgTable("special_predictions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  championTeamId: uuid("champion_team_id").references(() => teams.id),
  runnerUpTeamId: uuid("runner_up_team_id").references(() => teams.id),
  thirdPlaceTeamId: uuid("third_place_team_id").references(() => teams.id),
  topScorerPlayerId: uuid("top_scorer_player_id").references(() => players.id),
  bestPlayerId: uuid("best_player_id").references(() => players.id),
  mostGoalsTeamId: uuid("most_goals_team_id").references(() => teams.id),
  bonusPoints: smallint("bonus_points"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ============================================================
// payments
// ============================================================

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull()
      .unique(),
    paid: boolean("paid").notNull().default(false),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    markedByEmail: text("marked_by_email"),
    notes: text("notes"),
  },
  (t) => [index("payments_paid_idx").on(t.paid)],
);

// ============================================================
// tournament_config (singleton, id = 1)
// ============================================================

export type BonusResults = {
  championTeamId?: string;
  runnerUpTeamId?: string;
  thirdPlaceTeamId?: string;
  topScorerPlayerId?: string;
  bestPlayerId?: string;
  mostGoalsTeamId?: string;
};

export const tournamentConfig = pgTable(
  "tournament_config",
  {
    id: smallint("id").primaryKey(),
    pozoAmountArs: integer("pozo_amount_ars").notNull().default(0),
    tournamentStartsAt: timestamp("tournament_starts_at", {
      withTimezone: true,
    }).notNull(),
    poolLocked: boolean("pool_locked").notNull().default(false),
    bonusResults: jsonb("bonus_results").$type<BonusResults>(),
    bonusResolvedAt: timestamp("bonus_resolved_at", { withTimezone: true }),
    apiSportsDailyCount: integer("api_sports_daily_count")
      .notNull()
      .default(0),
    apiSportsCountDate: date("api_sports_count_date").notNull().defaultNow(),
    apiPausedUntil: timestamp("api_paused_until", { withTimezone: true }),
  },
  (t) => [check("tournament_config_singleton", sql`${t.id} = 1`)],
);

// ============================================================
// admin_audit_log
// ============================================================

export const adminAuditLog = pgTable(
  "admin_audit_log",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    adminEmail: text("admin_email").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    payloadBefore: jsonb("payload_before"),
    payloadAfter: jsonb("payload_after"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("audit_created_at_idx").on(t.createdAt),
    index("audit_admin_email_idx").on(t.adminEmail),
    index("audit_target_idx").on(t.targetType, t.targetId),
  ],
);

// ============================================================
// sent_notifications (mail idempotency)
// ============================================================

export const sentNotifications = pgTable(
  "sent_notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    kind: notificationKind("kind").notNull(),
    referenceId: text("reference_id").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("sent_notifications_unique").on(t.userId, t.kind, t.referenceId),
  ],
);

// ============================================================
// Relations — necesarias para queries `with: { ... }` de Drizzle
// ============================================================

export const usersRelations = relations(users, ({ one, many }) => ({
  favoriteTeam: one(teams, {
    fields: [users.favoriteTeamId],
    references: [teams.id],
  }),
  accounts: many(accounts),
  predictions: many(predictions),
  specialPredictions: one(specialPredictions),
  payment: one(payments),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const teamsRelations = relations(teams, ({ many }) => ({
  homeMatches: many(matches, { relationName: "homeMatches" }),
  awayMatches: many(matches, { relationName: "awayMatches" }),
  players: many(players),
}));

export const playersRelations = relations(players, ({ one }) => ({
  team: one(teams, {
    fields: [players.teamId],
    references: [teams.id],
  }),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  homeTeam: one(teams, {
    fields: [matches.homeTeamId],
    references: [teams.id],
    relationName: "homeMatches",
  }),
  awayTeam: one(teams, {
    fields: [matches.awayTeamId],
    references: [teams.id],
    relationName: "awayMatches",
  }),
  predictions: many(predictions),
}));

export const predictionsRelations = relations(predictions, ({ one }) => ({
  user: one(users, {
    fields: [predictions.userId],
    references: [users.id],
  }),
  match: one(matches, {
    fields: [predictions.matchId],
    references: [matches.id],
  }),
}));

export const specialPredictionsRelations = relations(
  specialPredictions,
  ({ one }) => ({
    user: one(users, {
      fields: [specialPredictions.userId],
      references: [users.id],
    }),
    championTeam: one(teams, {
      fields: [specialPredictions.championTeamId],
      references: [teams.id],
    }),
    runnerUpTeam: one(teams, {
      fields: [specialPredictions.runnerUpTeamId],
      references: [teams.id],
    }),
    thirdPlaceTeam: one(teams, {
      fields: [specialPredictions.thirdPlaceTeamId],
      references: [teams.id],
    }),
    topScorerPlayer: one(players, {
      fields: [specialPredictions.topScorerPlayerId],
      references: [players.id],
    }),
    bestPlayer: one(players, {
      fields: [specialPredictions.bestPlayerId],
      references: [players.id],
    }),
    mostGoalsTeam: one(teams, {
      fields: [specialPredictions.mostGoalsTeamId],
      references: [teams.id],
    }),
  }),
);

export const paymentsRelations = relations(payments, ({ one }) => ({
  user: one(users, {
    fields: [payments.userId],
    references: [users.id],
  }),
}));

export const sentNotificationsRelations = relations(
  sentNotifications,
  ({ one }) => ({
    user: one(users, {
      fields: [sentNotifications.userId],
      references: [users.id],
    }),
  }),
);

// ============================================================
// Tipos inferidos para uso en código
// ============================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type Player = typeof players.$inferSelect;
export type NewPlayer = typeof players.$inferInsert;
export type Match = typeof matches.$inferSelect;
export type NewMatch = typeof matches.$inferInsert;
export type Prediction = typeof predictions.$inferSelect;
export type NewPrediction = typeof predictions.$inferInsert;
export type SpecialPrediction = typeof specialPredictions.$inferSelect;
export type NewSpecialPrediction = typeof specialPredictions.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type NewPayment = typeof payments.$inferInsert;
export type TournamentConfig = typeof tournamentConfig.$inferSelect;
export type NewTournamentConfig = typeof tournamentConfig.$inferInsert;
export type AdminAuditEntry = typeof adminAuditLog.$inferSelect;
export type NewAdminAuditEntry = typeof adminAuditLog.$inferInsert;
export type SentNotification = typeof sentNotifications.$inferSelect;
export type NewSentNotification = typeof sentNotifications.$inferInsert;
