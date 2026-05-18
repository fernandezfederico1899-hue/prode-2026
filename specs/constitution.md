# Constitution — Prode 2026

> Reglas técnicas y convenciones del proyecto. Toda implementación debe respetarlas. Si una regla bloquea el avance, se discute antes de violarla.

---

## 1. Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Runtime | Node.js | 22 LTS |
| Package manager | **pnpm** | 9.x |
| Framework | Next.js | 16 (App Router + Cache Components) |
| Lenguaje | TypeScript | 5.x con `strict: true` |
| DB | Neon Postgres (Serverless) | — |
| ORM | **Drizzle ORM** + drizzle-kit | — |
| Auth | **Auth.js (NextAuth v5)** con Google provider + Drizzle adapter | — |
| Validación | **Zod** | — |
| Env vars tipadas | `@t3-oss/env-nextjs` | — |
| UI | Tailwind CSS + shadcn/ui | Tailwind 4 |
| Forms | react-hook-form + `@hookform/resolvers/zod` | — |
| Mail | Resend + react-email | — |
| Fechas/timezone | `date-fns` + `date-fns-tz` (timezone `America/Argentina/Buenos_Aires`) | — |
| Testing unit/integ | Vitest | — |
| Testing E2E | Playwright (solo flujos críticos) | — |
| Hosting | Vercel (free tier) | — |

**Decisiones clave y por qué:**
- **Drizzle vs Prisma:** Drizzle es liviano, type-safe, sin generación de cliente, mejor cold-start en serverless. Para 15 users y queries simples sobra.
- **Auth.js v5 (no v4):** App Router nativo, Edge-compatible, sin migraciones de aquí a 1 año.
- **pnpm:** consistente con el resto de proyectos de Federico (Franky, Diego, futbol-ar). Más rápido y menos espacio en disco.
- **Cache Components:** Next 16 trae PPR estable + `use cache`. Lo usamos para fragmentos cacheables (tabla de posiciones, fixture).

---

## 2. Estructura de carpetas

```
prode-2026/
├── src/
│   ├── app/                       # App Router
│   │   ├── (public)/              # Rutas no autenticadas: landing, login
│   │   ├── (app)/                 # Rutas autenticadas: dashboard, prono, tabla
│   │   ├── (admin)/               # Rutas admin: usuarios, pagos, resultados
│   │   ├── api/                   # Endpoints REST (solo cuando no se puede server action)
│   │   │   ├── auth/[...nextauth]/
│   │   │   └── cron/sync-live/    # Cron de Vercel
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn primitives (button, input, dialog)
│   │   └── [feature]/             # Componentes de feature (match-card, leaderboard-row)
│   ├── db/
│   │   ├── schema.ts              # Drizzle schemas
│   │   ├── index.ts               # Cliente Drizzle (drizzle(neon(env.DATABASE_URL)))
│   │   └── migrations/            # Generadas por drizzle-kit
│   ├── lib/
│   │   ├── auth.ts                # Auth.js config
│   │   ├── env.ts                 # @t3-oss/env-nextjs
│   │   ├── timezone.ts            # Helpers ART
│   │   └── scoring.ts             # Cálculo de puntos (3/1 + bonus)
│   ├── server/
│   │   ├── actions/               # Server Actions (mutations)
│   │   │   ├── predictions.ts
│   │   │   ├── admin.ts
│   │   │   └── payments.ts
│   │   ├── queries/               # Server-side data fetching (cacheable)
│   │   │   ├── leaderboard.ts
│   │   │   ├── matches.ts
│   │   │   └── user.ts
│   │   └── integrations/
│   │       ├── api-sports.ts      # Cliente API-Sports + rate limiting
│   │       ├── openfootball.ts    # Fetcher + parser del JSON
│   │       └── resend.ts          # Helpers de mail
│   └── emails/                    # react-email templates
├── specs/                         # Spec + clarifications + constitution + plan
├── public/
├── tests/
│   ├── unit/                      # Vitest
│   └── e2e/                       # Playwright
├── drizzle.config.ts
├── next.config.ts
├── package.json
├── tsconfig.json
└── .env.example                   # Plantilla, NUNCA commitear .env
```

**Reglas de estructura:**
- Server Actions viven en `src/server/actions/`. Mutations only.
- Queries del lado server viven en `src/server/queries/`. Pueden ser usadas en RSC con `use cache`.
- Componentes de UI (shadcn) en `src/components/ui/`. NO modificarlos a mano salvo regenerándolos con `npx shadcn add`.
- Componentes de feature en `src/components/[feature]/`.
- Una ruta = una carpeta en `app/`. Server Component por default; `'use client'` solo cuando es necesario.

---

## 3. Convenciones de naming

| Tipo | Convención | Ejemplo |
|---|---|---|
| Archivos | `kebab-case.ts` | `match-card.tsx`, `api-sports.ts` |
| Componentes React | `PascalCase` | `MatchCard`, `LeaderboardRow` |
| Funciones | `camelCase` | `calculateScore`, `parseFixture` |
| Server Actions | `camelCase` + sufijo `Action` | `submitPredictionAction` |
| Constantes | `SCREAMING_SNAKE_CASE` | `MAX_SCORE = 15` |
| Types/Interfaces | `PascalCase`, sin prefijo `I` | `Match`, `Prediction`, `UserStatus` |
| Tablas DB | `snake_case` plural | `users`, `matches`, `predictions` |
| Columnas DB | `snake_case` singular | `kickoff_at`, `home_score` |
| Branches Git | `feat/`, `fix/`, `chore/`, `docs/` + kebab | `feat/scoring-engine` |
| Env vars | `SCREAMING_SNAKE_CASE` | `DATABASE_URL`, `RESEND_API_KEY` |

**Naming semántico:**
- `kickoff_at` (no `start_time`, no `date`)
- `home_score` / `away_score` (no `score1` / `score2`)
- `status` con enums explícitos (`scheduled | live | finished | postponed | cancelled`)
- Funciones de cálculo: verbo + objeto (`calculatePoints`, no `points`)

**Idioma:**
- Código (variables, funciones, comentarios, commits): **inglés**
- Spec, docs, copy de UI: **español**
- Mensajes de error al usuario: **español**

---

## 4. Patrones obligatorios

### 4.1 Server Actions sobre API routes
- Mutations: **siempre Server Actions** (`'use server'`).
- Exception: webhooks externos y crons de Vercel → API routes en `app/api/`.
- Toda action recibe input validado con Zod. Retorna `{ ok: true, data } | { ok: false, error }`.

```ts
'use server';
import { z } from 'zod';

const submitPredictionSchema = z.object({
  matchId: z.string().uuid(),
  homeScore: z.number().int().min(0).max(15),
  awayScore: z.number().int().min(0).max(15),
});

export async function submitPredictionAction(input: unknown) {
  const parsed = submitPredictionSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid_input' };
  // ...
}
```

### 4.2 Validación en boundaries
- **Input de usuario:** Zod siempre (forms y server actions).
- **Respuestas de APIs externas:** Zod (API-Sports, openfootball).
- **Internas (DB → app):** confiar en los tipos inferidos de Drizzle, no revalidar.

### 4.3 Auth check en cada server action / page protegida
Patrón único:

```ts
import { auth } from '@/lib/auth';

export async function someAdminAction() {
  const session = await auth();
  if (!session?.user) return { ok: false, error: 'unauthorized' };
  if (session.user.email !== env.ADMIN_EMAIL) return { ok: false, error: 'forbidden' };
  // ...
}
```

### 4.4 Cálculo de puntos
- **Función pura** en `src/lib/scoring.ts`. No toca DB.
- Recibe `(prediction, result) => points`.
- Se llama desde una server action / query, no inline en componentes.
- Cubierta por tests unitarios (Vitest) — esto SÍ se testea.

### 4.5 Timezone
- TODA fecha en DB se guarda en **UTC** (`timestamp with time zone`).
- Conversión a ART solo en la capa de presentación (`src/lib/timezone.ts`).
- Cierre de pronósticos: comparación contra `now()` en UTC.

### 4.6 Manejo de errores
- Server actions: nunca tiran. Retornan `{ ok: false, error: 'codigo' }`.
- Páginas server: `error.tsx` por ruta para errores no manejados.
- Console.error con contexto en errores no recuperables; surfaceá al usuario un mensaje genérico en español.
- No tragar errores silenciosamente. Si lo ignorás a propósito, comentá por qué.

### 4.7 Env vars
- Toda env var definida en `src/lib/env.ts` con `@t3-oss/env-nextjs`.
- Separar `server` vs `client` (las client deben empezar con `NEXT_PUBLIC_`).
- `.env.example` siempre actualizado, sin valores reales.
- NUNCA leer `process.env.X` directo en código de feature.

---

## 5. Anti-patrones (NO hacer)

- ❌ **No usar Prisma.** Decisión tomada por Drizzle.
- ❌ **No usar Pages Router.** Solo App Router.
- ❌ **No usar Tailwind con `var(--xxx)` inline.** Usar el theme + `cn()` helper.
- ❌ **No mockear DB en tests.** Para tests de integración, usar Neon branch o Postgres local.
- ❌ **No exponer secrets en client components.** Si una env var no es `NEXT_PUBLIC_`, no la importes desde un `'use client'`.
- ❌ **No comentarios obvios.** `// increment counter` sobre un `counter++` se va a code review y se borra.
- ❌ **No abstracciones prematuras.** 3 usos antes de extraer. Para este proyecto (3 semanas, 15 users): "duplicación tolerable" es la regla.
- ❌ **No `any` ni `as unknown as X`** para esquivar tipos. Si lo necesitás, frená y pensá.
- ❌ **No suspense boundaries sin fallback.** Siempre `<Suspense fallback={...}>`.
- ❌ **No async client components.** Si necesitás data fetching en cliente, usá un Server Component padre que pasa props.
- ❌ **No mutar respuestas de DB para "agregar campos calculados".** Hacelo en una capa de mapper si es necesario.
- ❌ **No commits a `main` directo.** Branches `feat/...` + PR (aunque sea un PR de 1 persona, sirve para review propio).
- ❌ **No `--no-verify` en commits.** Si un hook falla, se arregla.

---

## 6. Dependencias permitidas

**Pre-aprobadas:**
- Todo lo del stack en sección 1
- `clsx`, `tailwind-merge` (vienen con shadcn)
- `lucide-react` (iconos, vienen con shadcn)
- `sonner` (toasts, vienen con shadcn)
- `nanoid` o `cuid2` si necesitamos IDs cortos para invites
- `pg` / `@neondatabase/serverless` (driver de Neon)

**Requieren discusión antes de instalar:**
- Otra librería de UI distinta a shadcn
- ORM alternativo a Drizzle
- State management client-side (Zustand/Jotai/Redux) — empezamos sin nada, agregamos solo si hace falta
- Librerías de carrusel, charts, animaciones complejas

**Prohibidas:**
- Cualquier paquete con menos de 1000 weekly downloads y sin maintenance los últimos 6 meses
- Cualquier paquete que reemplace funcionalidad nativa de Next/React sin justificación

---

## 7. DB y migraciones

- **Migrations gestionadas por drizzle-kit.** Generar con `pnpm db:generate`, aplicar con `pnpm db:migrate`.
- **Cada migration en su propio archivo**, versionado en `src/db/migrations/`.
- **NO editar migrations ya aplicadas.** Si hay que cambiar, generar una nueva.
- **Naming:** drizzle-kit auto-genera, está OK. Si renombramos, prefijo `YYYYMMDD_descripcion.sql`.
- **Seeds:** script `src/db/seed.ts` para fixture inicial desde openfootball. Idempotente.
- **Backups:** Neon hace point-in-time recovery automático. No setup adicional.

---

## 8. Testing strategy

Dado el deadline ajustado (3 semanas), pragmatismo:

| Área | Cobertura objetivo |
|---|---|
| **Scoring (`lib/scoring.ts`)** | 100% — es el core del prode, no puede fallar |
| **Validadores Zod** | Smoke tests (1 caso happy + 1 inválido por schema) |
| **Server actions críticas** (submit prediction, mark paid, correct result) | Integration tests con DB de test |
| **Parsing de openfootball y API-Sports** | Unit tests con fixtures (JSON guardado en `tests/fixtures/`) |
| **Componentes UI** | NO se testean unitariamente |
| **E2E (Playwright)** | 3 flujos: login → cargar pronóstico → ver tabla. NO más. |

**Reglas de test:**
- Tests viven en `tests/unit/` y `tests/e2e/`, espejando la estructura de `src/`
- `pnpm test` corre Vitest en watch mode local
- `pnpm test:ci` corre Vitest sin watch + Playwright
- CI corre en GitHub Actions (solo `pnpm typecheck && pnpm lint && pnpm test:ci`)

---

## 9. Estándares de calidad

- **TypeScript strict** + `noUncheckedIndexedAccess: true`. Sin `any`.
- **ESLint flat config** (configuración por defecto de Next + plugin de Drizzle).
- **Prettier** con config por defecto (2 spaces, single quotes, trailing comma).
- **Husky + lint-staged** en pre-commit: corre prettier + eslint --fix solo sobre archivos staged.
- **Pre-push hook:** corre `pnpm typecheck`. Si falla, no se pushea.
- **PRs:** título en español, descripción con qué/por qué/cómo testear. Auto-review propio antes de mergear.

---

## 10. Performance y costos

- **Cache Components** (Next 16): usar `use cache` en queries de leaderboard y fixture. Tag-based invalidation cuando se finaliza un partido.
- **DB queries:** preferir 1 query con joins sobre N+1.
- **API-Sports:** rate limit propio en `src/server/integrations/api-sports.ts`. Si superamos 80 reqs/día, alertar al admin por mail (log + Resend).
- **Resend:** batchear envíos de notificaciones (1 send con `to: [array]` cuando aplica).
- **Vercel free tier:** budget de bandwidth y function invocations. Monitorear en dashboard. Si nos acercamos al límite, optimizar antes de upgradear.

---

## 11. Git workflow

- Branches: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`
- Commits: en **español**, conventional commits cortos (`feat: ...`, `fix: ...`, `chore: ...`). Sin gerundios.
- PRs: 1 feature por PR. Si pasa de 400 líneas, pensar si se puede dividir.
- Merge a `main`: squash + descripción del PR como mensaje del squash.
- NO force push a `main`. NUNCA.
- Tags: `v0.1`, `v0.2`, etc. cuando deployamos a producción.

---

## 12. Seguridad

- Secrets en Vercel env vars (production + preview + development). Local en `.env.local` (gitignored).
- Toda mutation valida sesión + rol en server.
- Pronósticos: lock por server (check `kickoff_at < now()`). El cliente NO puede mentir.
- Pagos: solo el admin marca. Validación en server action.
- No exponer IDs internos secuenciales. UUIDs en URLs públicas.
- CORS: default de Next (mismo origen). Cron de Vercel valida `Authorization: Bearer ${CRON_SECRET}`.

---

## 13. Responsive / Mobile-first (requisito de primera línea)

**No es opcional, no es un afterthought.** La mayoría de los jugadores van a entrar desde el celular.

### Estándares no negociables
- **Mobile-first:** estilos default = mobile. `sm: md: lg: xl:` para escalar arriba.
- **Touch targets:** mínimo 44×44 px (Apple HIG). Si shadcn no llega, override.
- **Sin `:hover` como único feedback:** todo lo clickeable se ve clickeable sin hover.
- **Inputs numéricos:** `inputMode="numeric"` para que el teclado mobile sea numérico.
- **Dropdowns largos:** Combobox de shadcn con search, NUNCA `<select>` nativo en mobile.
- **Navegación adaptativa:** bottom tab bar en mobile (`hidden md:block`), top nav o sidebar en desktop.
- **Tablas:** la tabla de posiciones NO hace scroll horizontal en mobile. Se rediseña como cards apiladas; en desktop, tabla tradicional.
- **Modals:** Sheet (drawer desde abajo) en mobile, Dialog en desktop.
- **Imágenes:** `next/image` siempre, con sizes correctos. Sin `<img>`.

### Performance mobile
- LCP objetivo: < 2.5s en 3G simulado.
- Bundle JS inicial: < 100kb gzipped.
- Sin animaciones gratuitas.

### Test en cada feature
- Mobile viewport (375×667 mínimo).
- Desktop (1440×900).
- Forms usables con teclado mobile.
- Sin overflow horizontal.
- Texto legible sin zoom (≥ 14px en mobile).

---

## 14. Definition of Done por feature

Una feature está hecha cuando:
1. ✅ Cumple los criterios de aceptación de la spec
2. ✅ Pasa `pnpm typecheck` sin errores
3. ✅ Pasa `pnpm lint`
4. ✅ Tests relevantes verdes (según matriz de la sección 8)
5. ✅ **Probada en mobile real (no solo DevTools)** abriendo el preview de Vercel desde tu celular
6. ✅ Probada en desktop
7. ✅ Sin overflow horizontal, touch targets OK, teclado mobile correcto
8. ✅ Mergeada a `main` vía PR
9. ✅ Visible en preview de Vercel

---

## Próximo paso

Constitution establecida → `/speckit-plan` para diseño técnico (modelo de datos detallado, rutas, componentes, orden de implementación).
