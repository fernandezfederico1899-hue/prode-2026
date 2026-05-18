# Architecture Deep Dive — Prode 2026

> Este doc captura el análisis crítico de la arquitectura **antes** de escribir el `/speckit-plan`. Cada sección plantea una decisión arquitectónica con tradeoffs honestos. Lo que se resuelve acá se vuelve restricción del plan.

**Filosofía guía:** la calidad arquitectónica importa más que la velocidad. Si una decisión es "rápida pero floja", se discute. Lo que se recorta cuando el deadline aprieta es **alcance**, no calidad.

---

## 1. Storage de puntos: derivado vs stored

### Pregunta
¿Los puntos de cada pronóstico se **calculan al vuelo** (función pura sobre `prediction + result` en cada lectura) o se **guardan** en la fila de `prediction` cuando el partido finaliza?

### Tradeoffs

**Opción A — Calculado al vuelo (derivado):**
- ✅ Una sola fuente de verdad (el algoritmo de scoring).
- ✅ Si cambia el sistema de puntaje, no hay backfill.
- ✅ Si se corrige un resultado, los puntos se "actualizan" automáticamente al re-leer.
- ❌ La tabla de posiciones requiere JOIN de `predictions × matches × results` y SUM en cada request.
- ❌ Para 15 jugadores × 104 partidos = 1560 filas. Manejable, pero crece si se agregan stats.

**Opción B — Stored (denormalizado):**
- ✅ Query de tabla = `SELECT user_id, SUM(points) FROM predictions GROUP BY user_id`. Rápido y simple.
- ✅ Cache friendly (Cache Components con `use cache` aplica trivial).
- ❌ Si se cambia el algoritmo o se corrige un resultado, hay que recalcular y persistir.
- ❌ Riesgo de inconsistencia si la recompute falla a la mitad.

**Opción C — Híbrido (derivado pero materializable):**
- Función pura `calculatePoints(prediction, result)` siempre disponible.
- Guardamos `points` en `predictions` como **cache materializado** (no source of truth).
- Job idempotente `recalculatePoints(matchId)` corre cuando: (a) match finalize, (b) admin corrige resultado.
- Si se duda de la consistencia: `pnpm recalculate-all` rehace todo en una transacción.

### Recomendación
**Opción C — híbrido.**

Razones:
1. El scoring es **lógica de dominio crítica**. Vive en `lib/scoring.ts` como función pura, testeable al 100%, sin DB.
2. Persistir el resultado calculado nos da queries baratas para la tabla (que se ve mucho).
3. La recompute es **idempotente** y disparada por eventos claros (match finalize, admin correct). No es magia oculta.
4. Si alguna vez hay duda de inconsistencia, el job de full-recalculate es la "panic button" reproducible.

### Implicancias
- Tabla `predictions` lleva columna `points INTEGER NULL` (null = aún no calculado).
- Cada finalize de partido → trigger explícito de `recalculatePoints(matchId)` en una transacción.
- Tests:
  - `lib/scoring.ts`: unit tests al 100% (input → output puro).
  - `recalculatePoints`: integration test con DB de test (insert → corregir → verificar).

---

## 2. Identidad del partido vs fuentes externas

### Pregunta
Un partido viene de **dos fuentes** (openfootball y API-Sports) con IDs distintos. ¿Cómo modelamos esa identidad?

### Tradeoffs

**Opción A — Columnas opcionales en `matches`:**
```ts
matches: {
  id: uuid primary key,                    // nuestro ID interno
  openfootball_match_id: text nullable,    // ref
  api_sports_fixture_id: integer nullable, // ref
  // ...
}
```
- ✅ Simple, 1 tabla.
- ❌ Si en el futuro agregamos una 3ra fuente (ej widget oficial FIFA), columna nueva.

**Opción B — Tabla `external_refs`:**
```ts
matches: { id, kickoff_at, home_team, away_team, status, ... }
external_refs: { match_id, source: 'openfootball'|'api_sports', external_id }
```
- ✅ Extensible. Una fuente nueva = filas, no schema change.
- ✅ Un mismo match puede tener N refs.
- ❌ Una indirección más.
- ❌ Para 15 users y 1 torneo, posiblemente over-engineering.

### Recomendación
**Opción A — columnas opcionales en `matches`.**

Razones:
1. **YAGNI honesto**: no vamos a agregar una 3ra fuente. Es 1 torneo, 64 días de vida del proyecto.
2. La indirección de Opción B sería un costo permanente para un beneficio hipotético.
3. Si algún día hace falta, la migración a Opción B es mecánica.

### Implicancias
- `matches.openfootball_match_id` y `matches.api_sports_fixture_id`, ambos UNIQUE NULL OK.
- Función de mapping (`server/integrations/openfootball.ts`) busca por `(kickoff_at ± 1h, home_team, away_team)` con normalización.
- Si el matching automático falla en algún partido, el admin lo resuelve a mano desde panel.

---

## 3. State machine de partidos

### Pregunta
Los estados son `scheduled | live | finished | postponed | cancelled`. ¿Qué transiciones son válidas?

### Diagrama propuesto

```
                 ┌──────────────┐
                 │  scheduled   │◄──────────┐
                 └──────┬───────┘           │ (admin reabre)
                        │                   │
        ┌───────────────┼───────────────┐   │
        │               │               │   │
        ▼               ▼               ▼   │
   ┌────────┐     ┌──────────┐    ┌─────────┐
   │  live  │────►│ finished │    │postponed├──┘
   └────┬───┘     └──────────┘    └─────────┘
        │
        └────────► finished (común)
        └────────► cancelled (raro: abandono en cancha)

   cancelled (terminal — no se sale de acá)
   finished (cuasi-terminal — solo admin puede corregir score, no estado)
```

### Reglas

| Transición | Quién | Cómo |
|---|---|---|
| `scheduled → live` | Sistema | API-Sports devuelve status `live` |
| `scheduled → postponed` | Admin | Manualmente desde panel |
| `scheduled → cancelled` | Admin | Manualmente |
| `live → finished` | Sistema | API-Sports devuelve status `finished` |
| `live → cancelled` | Admin | Si se abandona (rarísimo) |
| `postponed → scheduled` | Admin | Setea nueva `kickoff_at`, vuelve a `scheduled`. **Reabre pronósticos.** |
| `finished → *` | ❌ NUNCA | El estado finished es cuasi-terminal. Solo se permite editar el score, no el estado. |
| `cancelled → *` | ❌ NUNCA | Terminal. |

### Implicancias
- En DB: `status` como enum (Postgres) o text + CHECK. Voy por **enum** (seguridad de tipos, errores antes).
- En código: función `transitionMatchStatus(matchId, newStatus)` valida la transición. Si es inválida → throw / `{ ok: false, error }`.
- Cada transición es un evento que dispara side-effects:
  - `→ live`: marcar la ventana de polling activa.
  - `→ finished`: trigger `recalculatePoints(matchId)`.
  - `→ postponed`: reabrir pronósticos (UI lo refleja).
  - `→ cancelled`: marcar `predictions.points = 0` para ese match (o NULL, ver decisión 1).
- Cuando es admin quien cambia, queda en audit log (ver decisión 6).

---

## 4. Recompute strategy: cuándo y cómo

### Pregunta
Si un partido finaliza o un admin corrige un resultado, hay que recalcular puntos. ¿Cómo orquestamos eso?

### Tradeoffs

**Opción A — Inline en la transacción:**
- Cuando se marca match como finished, en la misma transacción se recalculan todos los `predictions.points` de ese match.
- ✅ Atomicidad garantizada por la DB.
- ✅ Sin colas, sin event bus, sin workers.
- ❌ Si son muchos jugadores, la transacción es lenta. Para 15: irrelevante.

**Opción B — Event-driven con background job:**
- Finalize publica evento `match.finalized`. Worker lo procesa.
- ✅ Desacoplado, escalable.
- ❌ Para 15 users es **dramáticamente over-engineering**. Vercel free no tiene workers persistentes.

**Opción C — Inline + idempotent batch:**
- Por default, recompute inline en la transacción de finalize.
- Adicionalmente, comando `pnpm recalculate-all` (admin) re-corre todo en una transacción.
- Si hay duda, ese comando es el "reset" reproducible.

### Recomendación
**Opción C.**

Razones:
1. La transacción inline es **simple, atómica, suficiente** para 15 users × 104 partidos.
2. El comando idempotente es nuestra red de seguridad: si descubrimos un bug en scoring 3 semanas después, una vez deployado el fix corremos el comando y ya.
3. Cero infraestructura extra (sin colas, sin Inngest, sin Trigger.dev).

### Implicancias
- `server/scoring/recalculatePoints.ts` exporta `recalculateForMatch(matchId, tx?)` y `recalculateAll(tx?)`.
- Ambas reciben opcional `tx` para componerse en transacciones más grandes.
- Cron de finalize llama `recalculateForMatch` dentro de la transacción que cambia `match.status` a `finished`.
- Admin correct invoca el mismo path: setea nuevo score + recompute en la misma tx.

---

## 5. Configuración: env var vs row en DB

### Pregunta
Hay valores como "monto del pozo", "está lockeado el torneo?", "fecha del primer partido", "se resolvieron los bonus especiales?". ¿Viven en env vars o en DB?

### Tradeoffs

**Env vars:**
- ✅ No hay que escribir UI ni migration.
- ❌ Cambiar requiere deploy.
- ❌ No se versiona ni audita el cambio.

**Tabla `tournament_config` (singleton):**
- ✅ Cambiable desde admin sin deploy.
- ✅ Auditable.
- ✅ Permite locks atómicos en transacciones (ej "si torneo arrancó, no se puede editar pozo").
- ❌ Una tabla más.

### Recomendación
- **Env vars:** solo lo que es secret o pertenece al runtime (DATABASE_URL, RESEND_API_KEY, NEXTAUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, API_SPORTS_KEY, ADMIN_EMAIL, CRON_SECRET).
- **DB `tournament_config` singleton:** `pozo_amount_ars`, `tournament_starts_at`, `special_picks_resolved_at`, `bonus_results` (jsonb con campeón/subcampeón/etc).

### Implicancias
- Tabla `tournament_config` con `id = 1` (singleton, CHECK constraint).
- Toda mutation del config valida en server: "si `tournament_starts_at < now()`, no se puede editar `pozo_amount_ars`".
- El admin resuelve bonus desde una pantalla `/admin/bonus-resolution` que toma snapshot de la realidad (campeón, goleador, etc) y persiste.

---

## 6. Audit log: ¿necesario?

### Contexto
Originalmente lo puse como "nice-to-have v2". Reconsidero.

### Argumento a favor (load-bearing)
- Hay **plata real** en juego (pozo).
- El admin (Federico) puede:
  - Corregir resultados → cambia los puntos de todos.
  - Aprobar/rechazar usuarios.
  - Cambiar monto del pozo.
  - Resolver bonus al final.
- Si alguno de los 15 amigos cuestiona "che, Fede, ¿vos cambiaste mi pronóstico?", sin audit log no hay forma de probar.
- El costo es bajo: 1 tabla `admin_audit_log (id, admin_email, action, target_id, payload_before, payload_after, created_at)`.

### Argumento en contra
- Más código, más tabla.
- "Confiá en el admin, son amigos."

### Recomendación
**Sí, audit log liviano.** Solo registramos acciones de admin: aprobaciones, correcciones de score, cambios de pozo, resolución de bonus. No registramos cada login ni cada pronóstico de jugador.

### Implicancias
- Tabla `admin_audit_log` con 6 campos.
- Helper `logAdminAction(action, targetId, before, after)` que se invoca dentro de cada mutation de admin (forma parte de la transacción).
- Vista `/admin/audit` (solo para Federico) que muestra el log paginado. Read-only.

---

## 7. Ventanas de polling: cómo decide el cron

### Pregunta
El cron corre cada 3 min. Necesita decidir: ¿hago request a API-Sports o me ahorro la llamada?

### Lógica propuesta

```ts
// /api/cron/sync-live
async function handler() {
  const now = Date.now();
  const windowMs = 5 * 60 * 1000; // 5 min de ventana pre-kickoff y post-finalize

  const relevantMatches = await db.matches.findMany({
    where: or(
      eq(matches.status, 'live'),
      and(
        eq(matches.status, 'scheduled'),
        between(matches.kickoff_at, now - windowMs, now + windowMs)
      )
    ),
  });

  if (relevantMatches.length === 0) return { skipped: true };

  // Hay al menos 1 partido en vivo o por empezar / recién terminado
  await syncFromApiSports(relevantMatches);
  await trackApiUsage(); // incrementa contador diario
}
```

### Edge cases que esto cubre
- ✅ Partido por empezar (kickoff -5 min): empezamos a sincronizar antes para no perdernos el `→ live`.
- ✅ Partido recién finalizado: seguimos sincronizando 5 min más por si hay correcciones tardías.
- ✅ Sin partidos: no consumimos request.
- ✅ Si la DB está vacía (antes del seed): no rompe, returns skip.

### Decisión adicional: ¿qué pasa si el cron falla?
- Vercel cron reintenta automáticamente.
- Si la API responde 5xx → loguear y dejar pasar (el próximo cron lo agarra).
- Si la API responde 429 (rate limit) → alerta inmediata por mail al admin, pausar el cron las próximas horas (flag en `tournament_config`).

---

## 8. Cache & invalidación (Next 16 Cache Components)

### Pregunta
¿Qué pantallas se cachean? ¿Cómo se invalida?

### Estrategia

| Pantalla | Cacheada | Tag | Invalida cuando |
|---|---|---|---|
| `/` (landing post-login: tabla + próximos partidos) | Sí | `leaderboard`, `upcoming-matches` | Match finalize, admin correct, prediction submit |
| `/matches/[id]` (detalle de partido) | Sí | `match:${id}`, `predictions:${id}` (post-kickoff) | Match update, score correct |
| `/predict` (form de carga) | NO | — | Datos dinámicos por user |
| `/leaderboard` (tabla completa) | Sí | `leaderboard` | Match finalize, score correct, bonus resolved |
| `/admin/*` | NO | — | Datos en vivo siempre |

### Implementación
- Server queries en `src/server/queries/` con `'use cache'` y `cacheTag(...)`.
- En las server actions, después de mutar: `updateTag('leaderboard')` o `updateTag('match:${id}')`.

### Riesgo conocido
Si la lógica de invalidación tiene un bug, los usuarios ven datos viejos. Mitigación: invalidar agresivamente al principio, optimizar cuando funcione.

---

## 9. Idempotencia de mails

### Pregunta
El cron de "recordatorio 1h antes" puede dispararse 2 veces si Vercel reintenta. ¿Cómo evitamos doble mail?

### Solución
Tabla `sent_notifications`:
```ts
sent_notifications: {
  id: uuid,
  user_id: uuid,
  kind: 'reminder_1h' | 'round_summary' | 'tournament_end',
  reference_id: uuid,  // match_id o round_id según kind
  sent_at: timestamp,
  unique(user_id, kind, reference_id)
}
```

Antes de enviar, `INSERT ... ON CONFLICT DO NOTHING` y solo enviamos si la fila se insertó.

### Implicancias
- Una tabla más, pero es minúscula y resuelve idempotencia de forma robusta.
- También nos permite ver qué mails se enviaron (debugging, transparencia).

---

## 10. Definition of canonical "tournament started"

### Pregunta
"El torneo arrancó" se usa en varios lugares:
- Bloqueo de edición de pozo
- Cierre de pronósticos especiales
- Comportamiento de la landing (pre-torneo vs en-torneo)

### Solución
Una sola fuente de verdad: `tournament_config.tournament_starts_at` (timestamp).
- Default: kickoff del primer partido del fixture (se setea en el seed).
- Admin puede editar antes de que arranque (override).
- En código, helper `hasTournamentStarted()` que retorna `tournament_starts_at < now()`.

Toda lógica que dependa de "ya arrancó" usa ese helper. Nada de inferir de otros lados.

---

## 11. Modelo de equipos y jugadores

### Decisiones tomadas

**Tabla `teams`** con identidad canónica:
```ts
teams: {
  id: uuid PK,
  fifa_code: text UNIQUE,    // 'ARG', 'BRA', 'USA' (ISO 3166-1 alpha-3)
  name: text,                // 'Argentina'
  flag_emoji: text,          // 🇦🇷
  openfootball_name: text,
  api_sports_id: integer UNIQUE,
}

matches: {
  // ...
  home_team_id: uuid FK teams(id),
  away_team_id: uuid FK teams(id),
}
```

Esto habilita:
- Bonus "país más goleador" → query agregada por `team_id`
- Display consistente con banderita
- Mapping bilateral openfootball ↔ API-Sports sin string matching frágil

**Tabla `players`** (precargada en seed):
```ts
players: {
  id: uuid PK,
  api_sports_player_id: integer UNIQUE,
  name: text,                // 'Lionel Messi'
  team_id: uuid FK teams(id),
  position: text,
}
```

Usada por pronósticos especiales (goleador, mejor jugador) con dropdown + buscador. Resolución al final del torneo = match exacto por `player_id`, sin ambigüedad de strings.

### Resolución de bonus al final del torneo

- **Auto según API + override manual.** Al disparar `/admin/bonus-resolution`, el sistema intenta autocompletar consultando API-Sports (ej `/players/topscorers` para goleador). El admin revisa, ajusta si es necesario, y submitea.
- Para "campeón / subcampeón / 3er puesto": auto-detectado por estado final de los matches de KO (no requiere admin).
- Para "mejor jugador": no hay API confiable, lo carga el admin a mano cuando FIFA anuncia.
- Para "país más goleador": auto-computado por `SUM(goals) GROUP BY team_id`.

---

## 12. Responsive / Mobile-first

Federico marcó esto como crítico. **No es un afterthought, es un requisito de primera línea.**

### Estándares (no negociables)

**Breakpoints (Tailwind):**
- Mobile-first: estilos default = mobile (< 640px)
- `sm:` (≥ 640px) = tablet portrait
- `md:` (≥ 768px) = tablet landscape
- `lg:` (≥ 1024px) = desktop
- `xl:` (≥ 1280px) = wide desktop

**Touch targets:**
- Cualquier elemento interactivo: **mínimo 44×44 px** (Apple HIG) o 48×48 px (Material). Si shadcn no llega, override con `min-h-12 min-w-12`.
- Sin `:hover` como único feedback de interactividad. Todo lo clickeable se debe ver clickeable sin hover.

**Inputs:**
- Score: `inputMode="numeric"` + `pattern="[0-9]*"` para que el teclado móvil sea numérico.
- Dropdowns largos (jugadores, equipos): usar Combobox de shadcn con search, NO `<select>` nativo en mobile (es horrible).

**Layout patterns:**
- **Mobile:** navegación inferior (bottom tab bar) con 3-4 íconos (Pronósticos, Tabla, Partidos, Perfil).
- **Desktop:** sidebar lateral o top nav. Usamos `hidden md:block` / `block md:hidden` para alternar.
- **Tablas en mobile:** la tabla de posiciones NO se hace scroll horizontal. Se rediseña como cards apiladas en mobile, tabla tradicional en desktop. Es trabajo extra pero es lo correcto.
- **Modals:** en mobile, usar Sheet (drawer desde abajo). En desktop, Dialog clásico. shadcn permite ambos con la misma API.

**Imágenes:**
- Avatares y banderas: `next/image` siempre. Sin `<img>` raw.
- Lazy loading por default.
- Sizes correctos: el avatar de 32px en mobile no debe descargar el original de 400px.

**Performance mobile:**
- LCP objetivo: < 2.5s en 3G simulado.
- Bundle JS inicial: < 100kb gzipped. Cache Components ayuda aquí (la mayoría del UI es server-rendered).
- Sin animaciones gratuitas. Si hay transition, debe tener un propósito.

### Testing responsive

Parte del Definition of Done de cada feature:
1. ✅ Probada en mobile viewport (375×667, iPhone SE).
2. ✅ Probada en desktop (1440×900).
3. ✅ Probada en tablet (768×1024, opcional pero recomendado).
4. ✅ Texto legible sin zoom (mínimo 14px en mobile).
5. ✅ Sin overflow horizontal (scrollbar horizontal indeseado = bug).
6. ✅ Forms usables con teclado mobile (numérico para scores).

### Tooling
- Chrome DevTools device emulation para validación rápida.
- Antes de mergear cada feature: smoke test en celular real (lo abrís en tu Android desde el preview de Vercel).

---

## Resumen de decisiones

| # | Tema | Decisión |
|---|---|---|
| 1 | Storage de puntos | Híbrido: función pura + materializado en `predictions.points` |
| 2 | Identidad de partido | Columnas en `matches`: `openfootball_match_id`, `api_sports_fixture_id` |
| 3 | State machine | Enum + transiciones validadas en código |
| 4 | Recompute | Inline en transacción + comando `recalculateAll` |
| 5 | Config | Secrets en env, runtime config en `tournament_config` |
| 6 | Audit log | SÍ (load-bearing por plata + admin) |
| 7 | Cron de polling | Smart skip basado en estado de matches |
| 8 | Cache | Cache Components con tags + `updateTag` post-mutation |
| 9 | Mail idempotency | Tabla `sent_notifications` con unique constraint |
| 10 | "Tournament started" | `tournament_config.tournament_starts_at` como única fuente |
| 11 | Teams + players | Tablas canónicas con FKs en matches/predictions |
| 12 | Responsive | Requisito de primera línea: mobile-first, touch targets 44px, navegación adaptativa, tablas → cards en mobile |

---

## Lo que queda fuera (intencionalmente)

- ❌ Real-time WebSockets / SSE para live scores → polling cada 3min es suficiente.
- ❌ Background workers / queues → recompute inline alcanza.
- ❌ Multi-tenant / multi-grupo → 1 torneo único, hardcoded.
- ❌ Roles granulares → admin único por env var.
- ❌ Replay / event sourcing → audit log es suficiente.
- ❌ Anti-fraude (rate limiting de mutations por user, captcha) → son 15 amigos.
- ❌ Observability avanzada (Sentry, Datadog) → console.error + Vercel logs alcanza. Si crece, se agrega.

---

## Próximo paso

Con estas 10 decisiones cerradas (o sus contra-propuestas discutidas), el `/speckit-plan` puede salir limpio:
- Modelo de datos completo (tablas, columnas, índices, constraints).
- Rutas de la app.
- Componentes principales.
- Orden de implementación con dependencias.
