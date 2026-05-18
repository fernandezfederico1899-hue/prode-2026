# Plan Técnico — Prode 2026

> Plan de implementación detallado basado en [spec.md](./spec.md), [clarifications.md](./clarifications.md), [constitution.md](./constitution.md), [architecture-deep-dive.md](./architecture-deep-dive.md) y [visual-design.md](./visual-design.md).

---

## 1. Modelo de datos completo (10 tablas)

### Convenciones DB
- Postgres en Neon. Drizzle ORM.
- UUIDs (v4) para PKs, generados en DB.
- Timestamps en UTC (`timestamp with time zone`).
- Enums Postgres (no text + CHECK).
- Snake_case en tablas/columnas; camelCase en código TS via Drizzle inference.

### 1.1 `users`

```ts
export const userStatus = pgEnum('user_status', ['pending', 'approved', 'rejected']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  avatarUrl: text('avatar_url'),
  favoriteTeamId: uuid('favorite_team_id').references(() => teams.id, { onDelete: 'set null' }),
  status: userStatus('status').notNull().default('pending'),
  emailOptOut: boolean('email_opt_out').notNull().default(false),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  approvedByEmail: text('approved_by_email'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  emailIdx: index('users_email_idx').on(t.email),
  statusIdx: index('users_status_idx').on(t.status),
}));
```

### 1.2 `teams`

```ts
export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  fifaCode: text('fifa_code').notNull().unique(),           // 'ARG', 'BRA'
  name: text('name').notNull(),                              // 'Argentina'
  flagCode: text('flag_code').notNull(),                     // 'ar' (ISO 3166-1 alpha-2 lowercase for flag-icons)
  openfootballName: text('openfootball_name').notNull(),     // 'Argentina'
  apiSportsId: integer('api_sports_id').unique(),
  groupLetter: char('group_letter', { length: 1 }),          // 'A'..'L' (Mundial 48 = 12 grupos)
}, (t) => ({
  fifaCodeIdx: index('teams_fifa_code_idx').on(t.fifaCode),
  apiSportsIdIdx: index('teams_api_sports_id_idx').on(t.apiSportsId),
  groupLetterIdx: index('teams_group_letter_idx').on(t.groupLetter),
}));
```

### 1.3 `players`

```ts
export const players = pgTable('players', {
  id: uuid('id').defaultRandom().primaryKey(),
  apiSportsPlayerId: integer('api_sports_player_id').notNull().unique(),
  name: text('name').notNull(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  position: text('position'),
}, (t) => ({
  nameIdx: index('players_name_idx').on(t.name),           // para búsqueda con LIKE
  teamIdx: index('players_team_idx').on(t.teamId),
}));
```

### 1.4 `matches`

```ts
export const matchStage = pgEnum('match_stage', [
  'group', 'round_of_32', 'round_of_16', 'quarter', 'semi', 'third_place', 'final'
]);
export const matchStatus = pgEnum('match_status', [
  'scheduled', 'live', 'finished', 'postponed', 'cancelled'
]);

export const matches = pgTable('matches', {
  id: uuid('id').defaultRandom().primaryKey(),
  openfootballMatchId: text('openfootball_match_id').unique(),
  apiSportsFixtureId: integer('api_sports_fixture_id').unique(),
  homeTeamId: uuid('home_team_id').references(() => teams.id).notNull(),
  awayTeamId: uuid('away_team_id').references(() => teams.id).notNull(),
  kickoffAt: timestamp('kickoff_at', { withTimezone: true }).notNull(),
  venue: text('venue'),
  stage: matchStage('stage').notNull(),
  groupLetter: char('group_letter', { length: 1 }),         // null si KO
  status: matchStatus('status').notNull().default('scheduled'),
  homeScore: smallint('home_score'),
  awayScore: smallint('away_score'),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  lastSyncedAt: timestamp('last_synced_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  kickoffIdx: index('matches_kickoff_idx').on(t.kickoffAt),
  statusKickoffIdx: index('matches_status_kickoff_idx').on(t.status, t.kickoffAt),
  stageIdx: index('matches_stage_idx').on(t.stage),
  scoreCheck: check('matches_score_check',
    sql`(home_score IS NULL AND away_score IS NULL) OR
        (home_score BETWEEN 0 AND 99 AND away_score BETWEEN 0 AND 99)`
  ),
  differentTeamsCheck: check('matches_different_teams_check',
    sql`home_team_id <> away_team_id`),
}));
```

### 1.5 `predictions`

```ts
export const predictions = pgTable('predictions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  matchId: uuid('match_id').references(() => matches.id, { onDelete: 'cascade' }).notNull(),
  homeScore: smallint('home_score').notNull(),
  awayScore: smallint('away_score').notNull(),
  points: smallint('points'),                                // null = aún no calculado
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  userMatchUnique: unique('predictions_user_match_unique').on(t.userId, t.matchId),
  matchIdx: index('predictions_match_idx').on(t.matchId),
  userIdx: index('predictions_user_idx').on(t.userId),
  scoreCheck: check('predictions_score_check',
    sql`home_score BETWEEN 0 AND 15 AND away_score BETWEEN 0 AND 15`),
}));
```

### 1.6 `special_predictions`

```ts
export const specialPredictions = pgTable('special_predictions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  championTeamId: uuid('champion_team_id').references(() => teams.id),
  runnerUpTeamId: uuid('runner_up_team_id').references(() => teams.id),
  thirdPlaceTeamId: uuid('third_place_team_id').references(() => teams.id),
  topScorerPlayerId: uuid('top_scorer_player_id').references(() => players.id),
  bestPlayerId: uuid('best_player_id').references(() => players.id),
  mostGoalsTeamId: uuid('most_goals_team_id').references(() => teams.id),
  bonusPoints: smallint('bonus_points'),                     // materialized
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
```

### 1.7 `payments`

```ts
export const payments = pgTable('payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull().unique(),
  paid: boolean('paid').notNull().default(false),
  paidAt: timestamp('paid_at', { withTimezone: true }),
  markedByEmail: text('marked_by_email'),
  notes: text('notes'),
}, (t) => ({
  paidIdx: index('payments_paid_idx').on(t.paid),
}));
```

### 1.8 `tournament_config` (singleton)

```ts
export const tournamentConfig = pgTable('tournament_config', {
  id: smallint('id').primaryKey(),                           // forced = 1
  pozoAmountArs: integer('pozo_amount_ars').notNull().default(0),
  tournamentStartsAt: timestamp('tournament_starts_at', { withTimezone: true }).notNull(),
  poolLocked: boolean('pool_locked').notNull().default(false),
  bonusResults: jsonb('bonus_results').$type<{
    championTeamId?: string;
    runnerUpTeamId?: string;
    thirdPlaceTeamId?: string;
    topScorerPlayerId?: string;
    bestPlayerId?: string;
    mostGoalsTeamId?: string;
  }>(),
  bonusResolvedAt: timestamp('bonus_resolved_at', { withTimezone: true }),
  apiSportsDailyCount: integer('api_sports_daily_count').notNull().default(0),
  apiSportsCountDate: date('api_sports_count_date').notNull().defaultNow(),
  apiPausedUntil: timestamp('api_paused_until', { withTimezone: true }),
}, (t) => ({
  singletonCheck: check('tournament_config_singleton', sql`id = 1`),
}));
```

### 1.9 `admin_audit_log`

```ts
export const adminAuditLog = pgTable('admin_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminEmail: text('admin_email').notNull(),
  action: text('action').notNull(),                          // 'approve_user', 'correct_score', etc
  targetType: text('target_type').notNull(),                 // 'user', 'match', 'config'
  targetId: text('target_id').notNull(),
  payloadBefore: jsonb('payload_before'),
  payloadAfter: jsonb('payload_after'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  createdAtIdx: index('audit_created_at_idx').on(t.createdAt.desc()),
  adminEmailIdx: index('audit_admin_email_idx').on(t.adminEmail),
  targetIdx: index('audit_target_idx').on(t.targetType, t.targetId),
}));
```

### 1.10 `sent_notifications`

```ts
export const notificationKind = pgEnum('notification_kind', [
  'reminder_1h', 'round_summary', 'tournament_end', 'approval_status'
]);

export const sentNotifications = pgTable('sent_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  kind: notificationKind('kind').notNull(),
  referenceId: text('reference_id').notNull(),               // match_id, round_number, 'final', etc
  sentAt: timestamp('sent_at', { withTimezone: true }).notNull().defaultNow(),
}, (t) => ({
  uniqueIdempotency: unique('sent_notifications_unique').on(t.userId, t.kind, t.referenceId),
}));
```

### Relaciones (vista de alto nivel)

```
users ─┬─< predictions >─┬─ matches >─┬─ teams (home, away)
       │                 │             └─ players (via team)
       ├─< special_predictions ─→ teams + players
       ├─< payments
       ├─< sent_notifications
       └─< admin_audit_log (no FK, solo email texto)

tournament_config (singleton, sin FKs salvo en bonusResults.jsonb)
```

---

## 2. Rutas de la app

### 2.1 Públicas (no auth)

| Ruta | Tipo | Propósito |
|---|---|---|
| `/login` | RSC + client form | Login con Google (Auth.js) |
| `/pending` | RSC | "Tu solicitud está pendiente de aprobación" |
| `/rejected` | RSC | "Tu solicitud fue rechazada" |

### 2.2 App (autenticado + status=approved)

| Ruta | Tipo | Propósito |
|---|---|---|
| `/` | RSC + Cache Components | Dashboard: tabla top 5 + próximos 3 partidos + tu estado |
| `/predict` | RSC | Lista de partidos para cargar/editar pronósticos |
| `/predict/[matchId]` | RSC + client form | Detalle + form de un partido |
| `/specials` | RSC + client form | 6 picks pre-torneo (lockeado tras kickoff inicial) |
| `/leaderboard` | RSC + Cache Components | Tabla completa con filtros |
| `/matches` | RSC + Cache Components | Lista de partidos por fase/fecha |
| `/matches/[matchId]` | RSC + Cache Components | Detalle: score + pronósticos de todos (post-kickoff) |
| `/profile` | RSC + client form | Editar nombre, equipo fav, opt-out de mails, theme |

### 2.3 Admin (autenticado + email = ADMIN_EMAIL)

| Ruta | Tipo | Propósito |
|---|---|---|
| `/admin` | RSC | Dashboard: pending users, partidos por revisar, uso de API |
| `/admin/users` | RSC + client | Aprobar/rechazar pending users |
| `/admin/matches` | RSC + client | Corregir scores, transition status, set new kickoff |
| `/admin/payments` | RSC + client | Marcar pagos |
| `/admin/config` | RSC + client form | Editar pozo (con lock), tournament_starts_at |
| `/admin/bonus-resolution` | RSC + client form | Auto-fetch + override + dispara cálculo |
| `/admin/audit` | RSC + Cache Components | Log paginado read-only |
| `/admin/api-usage` | RSC | Métricas de uso API-Sports diario |

### 2.4 API routes

| Ruta | Tipo | Trigger |
|---|---|---|
| `/api/auth/[...nextauth]` | Auth.js handler | OAuth flow |
| `/api/cron/sync-live` | Cron de Vercel | Cada 3 min |
| `/api/cron/send-reminders` | Cron de Vercel | Cada 15 min |
| `/api/cron/send-summaries` | Cron de Vercel | Cada 1 hora |

Todos los crons validan `Authorization: Bearer ${CRON_SECRET}`.

### 2.5 Server Actions

Listadas por archivo en `src/server/actions/`:

**`predictions.ts`**
- `submitPredictionAction(input)` - cargar/editar score de un partido
- `submitBatchPredictionsAction(input)` - opcional, cargar varios de una

**`specials.ts`**
- `submitSpecialPredictionsAction(picks)` - guardar los 6 picks

**`profile.ts`**
- `updateProfileAction(name, favoriteTeamId, emailOptOut)`

**`admin/users.ts`**
- `approveUserAction(userId)`
- `rejectUserAction(userId)`

**`admin/matches.ts`**
- `correctMatchScoreAction(matchId, home, away)`
- `transitionMatchStatusAction(matchId, newStatus)`
- `setNewKickoffAction(matchId, newKickoff)`

**`admin/payments.ts`**
- `markPaymentAction(userId, paid, notes?)`

**`admin/config.ts`**
- `updateTournamentConfigAction(config)`

**`admin/bonus.ts`**
- `resolveBonusAction(results)`
- `autoFetchBonusFromApiAction()` - intenta autocompletar

**`admin/recompute.ts`**
- `recalculateAllAction()` - "panic button"
- `resyncFixtureAction()` - re-importa de openfootball

---

## 3. Estructura de archivos

```
src/
├── app/
│   ├── (public)/
│   │   ├── login/page.tsx
│   │   ├── pending/page.tsx
│   │   └── rejected/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                    # auth + approved guard, nav adaptativa
│   │   ├── page.tsx                      # dashboard
│   │   ├── predict/
│   │   │   ├── page.tsx
│   │   │   └── [matchId]/page.tsx
│   │   ├── specials/page.tsx
│   │   ├── leaderboard/page.tsx
│   │   ├── matches/
│   │   │   ├── page.tsx
│   │   │   └── [matchId]/page.tsx
│   │   └── profile/page.tsx
│   ├── (admin)/
│   │   ├── layout.tsx                    # admin guard
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── users/page.tsx
│   │       ├── matches/page.tsx
│   │       ├── payments/page.tsx
│   │       ├── config/page.tsx
│   │       ├── bonus-resolution/page.tsx
│   │       ├── audit/page.tsx
│   │       └── api-usage/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── cron/
│   │       ├── sync-live/route.ts
│   │       ├── send-reminders/route.ts
│   │       └── send-summaries/route.ts
│   ├── layout.tsx                        # root: ThemeProvider, Toaster, font setup
│   └── globals.css                       # @theme con paleta visual
│
├── components/
│   ├── ui/                               # shadcn primitives (button, input, dialog, etc)
│   ├── match/
│   │   ├── match-card.tsx
│   │   ├── match-card-compact.tsx
│   │   ├── match-detail-view.tsx
│   │   ├── score-input.tsx
│   │   └── live-dot.tsx
│   ├── leaderboard/
│   │   ├── leaderboard-table.tsx         # desktop
│   │   ├── leaderboard-cards.tsx         # mobile
│   │   └── position-medal.tsx
│   ├── prediction/
│   │   ├── prediction-form.tsx
│   │   ├── prediction-row.tsx
│   │   ├── prediction-status-badge.tsx
│   │   └── special-picks-form.tsx
│   ├── common/
│   │   ├── nav-mobile.tsx                # bottom tab bar
│   │   ├── nav-desktop.tsx               # top nav
│   │   ├── team-label.tsx                # flag + name
│   │   ├── team-combobox.tsx
│   │   ├── player-combobox.tsx
│   │   ├── theme-toggle.tsx
│   │   ├── tournament-lock-banner.tsx
│   │   ├── status-badge.tsx
│   │   ├── empty-state.tsx
│   │   └── error-fallback.tsx
│   └── admin/                            # componentes específicos del panel
│       ├── user-approval-list.tsx
│       ├── match-correction-form.tsx
│       └── audit-log-table.tsx
│
├── db/
│   ├── schema.ts                         # las 10 tablas
│   ├── index.ts                          # cliente Drizzle
│   ├── migrations/                       # auto-generadas
│   └── seed.ts                           # import openfootball + teams + players
│
├── lib/
│   ├── auth.ts                           # Auth.js config + helpers
│   ├── env.ts                            # @t3-oss/env-nextjs
│   ├── timezone.ts                       # ART helpers
│   ├── scoring.ts                        # PURE FUNCTION (100% test coverage)
│   ├── utils.ts                          # cn() y otros
│   └── constants.ts                      # MAX_SCORE, BONUS_POINTS, etc
│
├── server/
│   ├── actions/                          # ver sección 2.5
│   ├── queries/
│   │   ├── leaderboard.ts
│   │   ├── matches.ts
│   │   ├── predictions.ts
│   │   ├── user.ts
│   │   ├── teams.ts
│   │   └── players.ts
│   ├── scoring/
│   │   └── recalculate.ts                # recalculateForMatch + recalculateAll + recalculateBonus
│   ├── audit/
│   │   └── log.ts                        # logAdminAction helper
│   └── integrations/
│       ├── api-sports.ts                 # cliente + rate limit tracking
│       ├── openfootball.ts               # fetch + parse + mapping
│       └── resend.ts                     # send helpers
│
├── emails/                               # react-email templates
│   ├── reminder-1h.tsx
│   ├── round-summary.tsx
│   ├── tournament-end.tsx
│   └── approval-status.tsx
│
└── styles/                               # si hace falta CSS extra (no debería)
```

```
tests/
├── unit/
│   └── lib/
│       └── scoring.test.ts               # 100% coverage
├── integration/
│   ├── scoring/
│   │   └── recalculate.test.ts
│   ├── integrations/
│   │   ├── api-sports.test.ts
│   │   └── openfootball.test.ts
│   └── actions/
│       ├── predictions.test.ts
│       └── admin-users.test.ts
├── e2e/
│   ├── login-and-predict.spec.ts
│   ├── view-leaderboard.spec.ts
│   └── admin-correct-score.spec.ts
└── fixtures/
    ├── openfootball.json                 # snapshot del JSON real
    └── api-sports-live.json              # snapshot de respuesta de la API
```

---

## 4. Mapa de componentes principales

### 4.1 Componentes hero (los que más miran los usuarios)

**`<MatchCard>`** (`src/components/match/match-card.tsx`)
- Variantes: `scheduled | live | finished`
- Props: `match`, `userPrediction?`, `variant?: 'full' | 'compact'`
- Visual: ver visual-design.md sección 5.1
- Server Component (datos pasados como props)

**`<LeaderboardTable>` + `<LeaderboardCards>`**
- `<LeaderboardTable>` (desktop, `hidden md:block`)
- `<LeaderboardCards>` (mobile, `md:hidden`)
- Props: `rows: LeaderboardRow[]` (computed by query)
- Server Component

**`<ScoreInput>`** (`src/components/match/score-input.tsx`)
- Client Component (`'use client'`) — necesita estado
- Props: `value`, `onChange`, `disabled`, `homeTeam`, `awayTeam`
- Mobile: con +/- buttons, `inputMode="numeric"`
- Validación: 0-15

**`<SpecialPicksForm>`**
- Client Component
- 6 selects: 3 teams comboboxes + 3 players comboboxes (1 reuse)
- react-hook-form + zod resolver
- Lock visual cuando `tournament_config.tournamentStartsAt < now()`

### 4.2 Componentes "infraestructura"

- **`<NavMobile>` / `<NavDesktop>`** — switch responsive
- **`<ThemeToggle>`** — light/dark con next-themes
- **`<TournamentLockBanner>`** — aparece arriba en algunas pantallas
- **`<EmptyState>` / `<ErrorFallback>`** — patrones reutilizables

### 4.3 Combobox de equipos y jugadores

Reutilizables, basados en shadcn `<Command>`:
- **`<TeamCombobox>`** — fetch de los 48 teams desde queries cached
- **`<PlayerCombobox>`** — fetch lazy con búsqueda server-side (?q=mes → query LIKE %mes%)

---

## 5. Integraciones

### 5.1 openfootball (`src/server/integrations/openfootball.ts`)

```ts
export async function fetchWorldCupJson(): Promise<OpenFootballData>
export function parseTeamsFromOpenFootball(data): Team[]
export function parseMatchesFromOpenFootball(data): Match[]
export function normalizeTeamName(name: string): string  // 'United States' → 'usa'
```

Usado por:
- `db/seed.ts` (carga inicial)
- `admin/recompute.ts` → `resyncFixtureAction`

### 5.2 API-Sports (`src/server/integrations/api-sports.ts`)

```ts
export async function fetchLiveFixtures(): Promise<LiveFixture[]>
export async function fetchFixtureById(id: number): Promise<Fixture>
export async function fetchTopScorers(leagueId: number, season: number): Promise<Player[]>
export async function fetchPlayersByTeam(teamId: number): Promise<Player[]>

// Internamente:
async function callApiSports<T>(path: string, params: object): Promise<T>
// Hace: check pause flag, increment counter, fetch, error handling
```

Rate limit tracking en `tournament_config`:
- Cada call incrementa `apiSportsDailyCount`.
- Si `apiSportsDailyCount >= 80` → alerta por mail al admin.
- Si la API responde 429 → setear `apiPausedUntil = now() + 2h` y skipear cron.
- Counter se resetea a 0 cuando `apiSportsCountDate != today`.

### 5.3 Resend (`src/server/integrations/resend.ts`)

```ts
export async function sendReminder1h(user: User, match: Match)
export async function sendRoundSummary(user: User, round: number)
export async function sendTournamentEnd(user: User, winner: User, pozo: number)
export async function sendApprovalStatus(user: User, approved: boolean)
```

Cada función:
1. Check `users.emailOptOut`.
2. `INSERT INTO sent_notifications (...) ON CONFLICT DO NOTHING RETURNING id`.
3. Si no devuelve fila, skip (ya enviado).
4. Si sí, render react-email template + `resend.emails.send()`.

---

## 6. Cron jobs (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-live",
      "schedule": "*/3 * * * *"
    },
    {
      "path": "/api/cron/send-reminders",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/send-summaries",
      "schedule": "0 * * * *"
    }
  ]
}
```

**Vercel free tier:** permite 2 crons + 1 min granularidad. Si necesitamos un 3ro: lo metemos en uno y splitamos por tiempo dentro del handler. (Verificar al deployar; si es 2 max, fusiono reminders y summaries en uno solo).

---

## 7. Env vars (`.env.example`)

```bash
# DB
DATABASE_URL="postgresql://..."

# Auth.js
AUTH_SECRET=""
AUTH_GOOGLE_ID=""
AUTH_GOOGLE_SECRET=""
AUTH_URL="http://localhost:3000"  # cambia en prod

# Admin
ADMIN_EMAIL="fernandezfederico1899@gmail.com"

# API-Sports (api-football.com)
API_SPORTS_KEY=""
API_SPORTS_HOST="v3.football.api-sports.io"

# Resend
RESEND_API_KEY=""
RESEND_FROM="Prode 2026 <noreply@TU_DOMINIO_AQUI>"

# Cron
CRON_SECRET=""  # genera con: openssl rand -hex 32

# Opcional
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 8. Orden de implementación — Milestones

### **M1: Foundation** (semana 1, ~7-10 días)

**Goal:** la app corre localmente y en preview de Vercel, tiene auth, tiene fixture cargado en DB, layout responsive funciona.

| # | Task | Dependencia |
|---|---|---|
| 1.1 | `pnpm create next-app` + tsconfig strict + pnpm setup | — |
| 1.2 | Tailwind 4 + shadcn init + `globals.css` con paleta visual | 1.1 |
| 1.3 | Setup `next/font` con Bebas Neue + Inter | 1.2 |
| 1.4 | `lib/env.ts` con `@t3-oss/env-nextjs` + `.env.example` | 1.1 |
| 1.5 | Drizzle + neon driver + `drizzle.config.ts` + npm scripts (`db:generate`, `db:migrate`, `db:push`) | 1.1 |
| 1.6 | Schemas: users, teams, players, matches, tournament_config (M1 subset) | 1.5 |
| 1.7 | First migration aplicada en Neon | 1.6 |
| 1.8 | Auth.js v5 con Google + Drizzle adapter | 1.6 |
| 1.9 | `(public)/login/page.tsx` + middleware auth | 1.8 |
| 1.10 | Self-signup flow: status pending por default | 1.8 |
| 1.11 | Pages `(public)/pending` + `(public)/rejected` | 1.10 |
| 1.12 | Admin guard helper (`isAdmin(session)`) | 1.8 |
| 1.13 | Layout `(app)/layout.tsx` con guard de approved | 1.10 |
| 1.14 | `<NavMobile>` + `<NavDesktop>` responsive | 1.13 |
| 1.15 | `<ThemeToggle>` con next-themes | 1.2 |
| 1.16 | Página `/` placeholder ("hola, bienvenido al prode") | 1.13 |
| 1.17 | `db/seed.ts` — import openfootball/worldcup.json → teams + matches | 1.6 |
| 1.18 | Script ad-hoc para precargar players desde API-Sports al seed | 1.6, 1.17 |
| 1.19 | Init `tournament_config` con `tournament_starts_at` desde fixture | 1.7 |
| 1.20 | Deploy a Vercel + Neon production + env vars | 1.7 |
| 1.21 | Probar login con Google en preview | 1.20 |

**Entregables M1:**
- ✅ App live en Vercel
- ✅ Login funciona
- ✅ DB tiene 48 teams, 104 matches, ~700 players, 1 tournament_config
- ✅ Mobile + desktop nav funcionando
- ✅ Theme toggle funcionando
- ✅ Self-signup → pending state

### **M2: Predictions** (semana 2)

**Goal:** los users aprobados pueden cargar pronósticos por partido y los pronósticos especiales.

| # | Task | Dependencia |
|---|---|---|
| 2.1 | Schema: `predictions` + `special_predictions` + migración | M1 |
| 2.2 | Queries: `getMatchesForUser`, `getUserPredictions`, `getMatchWithPredictions` | 2.1 |
| 2.3 | `<MatchCard>` componente (variantes scheduled/live/finished) | M1 |
| 2.4 | `<ScoreInput>` componente con +/- buttons mobile | M1 |
| 2.5 | Page `/predict` con lista de partidos + form inline o link a detail | 2.2, 2.3 |
| 2.6 | Page `/predict/[matchId]` con `<ScoreInput>` | 2.4 |
| 2.7 | Server action `submitPredictionAction` con Zod + lock por kickoff | 2.1 |
| 2.8 | Toast (sonner) de feedback en submit | 2.7 |
| 2.9 | `<TeamCombobox>` + `<PlayerCombobox>` (lazy fetch con search) | M1 |
| 2.10 | Page `/specials` con `<SpecialPicksForm>` | 2.9 |
| 2.11 | Server action `submitSpecialPredictionsAction` con lock `tournament_starts_at` | 2.10 |
| 2.12 | Page `/matches` y `/matches/[id]` (read-only) | 2.2, 2.3 |
| 2.13 | Vista post-kickoff: pronósticos de todos los users (Suspense + check `kickoff_at < now()`) | 2.12 |
| 2.14 | Page `/profile` con form (name, fav team, opt-out, theme) | M1 |
| 2.15 | Server action `updateProfileAction` | 2.14 |
| 2.16 | Tests unitarios de Zod schemas | 2.7, 2.11 |

**Entregables M2:**
- ✅ Users cargan pronósticos
- ✅ Cargan los 6 picks especiales
- ✅ Ven detalle de partido pre/post kickoff
- ✅ Editan perfil

### **M3: Scoring & Live Sync** (semana 3)

**Goal:** los puntos se calculan, la API sincroniza resultados en vivo, el leaderboard muestra en tiempo real, los mails se mandan.

| # | Task | Dependencia |
|---|---|---|
| 3.1 | Schemas: `payments`, `admin_audit_log`, `sent_notifications` + migración | M1 |
| 3.2 | `lib/scoring.ts` función pura `calculateMatchPoints(prediction, result)` + `calculateBonusPoints(picks, results)` | M1 |
| 3.3 | Tests unitarios scoring (100% coverage, todos los casos) | 3.2 |
| 3.4 | `server/scoring/recalculate.ts` con `recalculateForMatch(matchId, tx?)` + `recalculateAll(tx?)` + `recalculateBonus(tx?)` | 3.1, 3.2 |
| 3.5 | Tests de integración de recompute | 3.4 |
| 3.6 | `server/integrations/api-sports.ts` con rate limit tracking | M1, 3.1 |
| 3.7 | Cron `/api/cron/sync-live` con smart skip + auth Bearer | 3.6, 3.4 |
| 3.8 | Vercel cron config (`vercel.json`) | 3.7 |
| 3.9 | Query `getLeaderboard()` con Cache Components + tag | 3.1 |
| 3.10 | Page `/leaderboard` con `<LeaderboardTable>` + `<LeaderboardCards>` | 3.9 |
| 3.11 | Page `/` dashboard con tabla top 5 + próximos partidos | 3.9 |
| 3.12 | `updateTag('leaderboard')` post-recompute | 3.4, 3.10 |
| 3.13 | `server/integrations/resend.ts` con idempotency via `sent_notifications` | 3.1 |
| 3.14 | Templates react-email: `reminder-1h.tsx`, `round-summary.tsx`, `tournament-end.tsx`, `approval-status.tsx` | 3.13 |
| 3.15 | Cron `/api/cron/send-reminders` | 3.13 |
| 3.16 | Cron `/api/cron/send-summaries` | 3.13 |
| 3.17 | Match detail con scores en vivo (live polling cliente cada 30s solo si `status=live`) | 3.7 |
| 3.18 | `<LiveDot>` componente pulsante | M1 |

**Entregables M3:**
- ✅ Scoring engine 100% testeado
- ✅ Cron sincroniza partidos
- ✅ Leaderboard en tiempo real
- ✅ Mails se mandan idempotentemente

### **M4: Admin & Polish** (semana 4)

**Goal:** panel admin completo, audit log, bonus resolution, E2E tests, mobile real testing, production ready.

| # | Task | Dependencia |
|---|---|---|
| 4.1 | `server/audit/log.ts` helper + wrap admin actions | M3 |
| 4.2 | `(admin)/layout.tsx` con guard ADMIN_EMAIL | M1 |
| 4.3 | `/admin` dashboard (counts: pending users, partidos live, uso API) | 4.2 |
| 4.4 | `/admin/users` + actions approve/reject + envía mail | 4.2, M3 |
| 4.5 | `/admin/matches` + actions correct score / transition / set new kickoff | 4.2, M3 |
| 4.6 | `/admin/payments` + action mark | 4.2 |
| 4.7 | `/admin/config` + lock check pre-tournament | 4.2 |
| 4.8 | Bonus auto-fetch logic (`server/integrations/api-sports.ts` → `fetchFinalResults()`) | M3 |
| 4.9 | `/admin/bonus-resolution` con auto + override manual | 4.8 |
| 4.10 | Action `resolveBonusAction` dispara `recalculateBonus` | 4.9 |
| 4.11 | `/admin/audit` log paginado | 4.1 |
| 4.12 | `/admin/api-usage` métricas (charts simples con divs proportionales, no librería) | 4.2 |
| 4.13 | Action `recalculateAllAction` (panic button) | 4.5 |
| 4.14 | Action `resyncFixtureAction` (recarga desde openfootball) | M1 |
| 4.15 | E2E tests (Playwright): login → predict → leaderboard | M3 |
| 4.16 | E2E test admin correct score → leaderboard updates | 4.5 |
| 4.17 | Empty states + error states en todas las pantallas | M3 |
| 4.18 | Loading skeletons en todas las pantallas | M3 |
| 4.19 | Mobile real testing en celular Android (lista de bugs + fixes) | M3 |
| 4.20 | Performance pass: bundle analyzer + LCP en 3G simulado | M3 |
| 4.21 | Backup/restore verificación (Neon PITR funciona) | M1 |
| 4.22 | Production deploy + dominio (si aplica) + DNS | M3 |
| 4.23 | Smoke test pre-Mundial (todos los flujos críticos) | 4.22 |

**Entregables M4:**
- ✅ Admin panel completo
- ✅ Audit log activo
- ✅ Bonus resolution funcional
- ✅ E2E tests pasando
- ✅ Probado en mobile real
- ✅ Listo para 11/06/2026

---

## 9. Decisiones que faltan resolver durante implementación

Estas las decidimos al llegar a su contexto, no antes:

1. **Lib de banderas SVG:** comparar `flag-icons` vs `country-flag-icons` cuando lleguemos a M1. Bundle size + DX.
2. **Vercel free tier — # de crons:** confirmar que permite 3 al deployar. Si es 2, fusionar reminders + summaries en un solo cron con switch interno.
3. **Logo del torneo:** generar con AI o dibujar a mano. Decisión en M1 antes de hacer la landing.
4. **Polling cliente live score:** ¿usamos `setInterval` o algo más fancy? Default: `setInterval` 30s con cleanup. Decisión en M3.
5. **Charts en `/admin/api-usage`:** SVG simple inline o librería? Default: SVG simple, sin lib.

---

## 10. Riesgos identificados

| Riesgo | Mitigación |
|---|---|
| API-Sports cambia coverage del WC | Carga manual desde admin como fallback (ya en spec) |
| Vercel cron no dispara (timeout, error de red) | Próximo cron lo agarra. Si es crítico, alerta por mail al admin |
| Mapping automático openfootball↔API-Sports falla en algún partido | Admin lo resuelve a mano desde `/admin/matches` |
| Bug en `scoring.ts` post-launch | `recalculateAllAction` lo arregla retroactivamente sin perder datos |
| Neon free tier se llena | 0.5 GB es enorme para 15 users × ~1000 predictions. No es realista llenar |
| Algún jugador cuestiona el resultado | Audit log defiende. Recompute reproducible |
| Federico se queda sin acceso de admin | Cambiar env var en Vercel dashboard (5 minutos) |

---

## 11. Métricas de éxito post-deploy

- ✅ 15 users registrados y aprobados antes del 11/06
- ✅ Todos cargaron sus 6 picks especiales antes del kickoff
- ✅ Sincronización de resultados con < 5 min de lag
- ✅ Cero pérdida de pronósticos
- ✅ Mails enviados sin duplicados
- ✅ Tabla actualizada después de cada partido finalizado en < 1 min
- ✅ Sin caídas durante partidos de Argentina (ojo si Argentina juega, picos)
- ✅ Pozo final repartido correctamente

---

## Próximo paso

Aprobación del plan → arrancamos `M1` (foundation). El primer paso concreto es: bootstrap del proyecto Next.js con todo el setup base.
