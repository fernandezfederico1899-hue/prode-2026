# Clarificaciones — Prode 2026

Resoluciones de la sesión `/speckit-clarify` del 2026-05-18.

## Bloqueantes — resueltas ✅

### 1. Mapping openfootball ↔ API-Sports
**Decisión:** match automático por `(kickoff_at, home_team, away_team)`.
**Razón:** evita mantener tabla de mapping manual. Vamos a normalizar nombres de equipos en el seed (ej "United States" → "USA").
**Implementación:** función `matchFixture(openFootballMatch, apiSportsFixtures)` busca por timestamp ± tolerancia (ej ± 1h) + alias de equipos.

### 2. Whitelist
**Decisión:** self-signup con aprobación.
**Flujo:**
- Cualquier persona con cuenta de Google puede ir a la app y hacer login.
- Al loguearse por primera vez se crea el user con `status = pending`.
- Ve una pantalla "Tu solicitud está pendiente de aprobación".
- Admin (Federico) recibe alerta y aprueba/rechaza desde `/admin/users`.
- Una vez `approved`, accede normal.

### 3. Score de eliminatoria
**Decisión:** clásico — resultado a los 90 minutos reglamentarios.
**Razón:** así lo hacen todos los prodes argentinos de toda la vida.
**Implementación:** el `score_home` y `score_away` que se cargan en cada partido (de fase de grupos o eliminatoria) son los del minuto 90. Si el partido va a alargue o penales, **no afecta el cálculo del prode**. Si predijiste 1-1 y terminó 1-1 (y ganó por penales), cobrás 3 pts (exacto).

### 4. Bonus subjetivos → reemplazados por objetivos
**Decisión:** eliminar "revelación" y "decepción", reemplazar por:
- **Mejor jugador del Mundial** (Balón de Oro FIFA): 10 pts
- **País más goleador del torneo**: 5 pts

**Razón:** ambos son objetivos. El primero lo define FIFA al final del torneo. El segundo se calcula sumando los goles de cada selección.

### 5. Desempate nivel 3
**Decisión:** empate compartido.
**Implementación:** si dos jugadores empatan en (puntos, exactos, signos), comparten posición. Si son los ganadores del prode, se reparten el pozo en partes iguales (50/50 si son 2, 33/33/33 si son 3, etc).

### 6. Identificación del admin
**Decisión:** email hardcoded en env var.
**Implementación:** `ADMIN_EMAIL=fernandezfederico1899@gmail.com` en Vercel env. Middleware verifica `session.user.email === process.env.ADMIN_EMAIL`.

### 7. Partido pospuesto/cancelado
**Decisión:** schema lo contempla.
**Estados posibles:** `scheduled | live | finished | postponed | cancelled`.
**Comportamiento:**
- `postponed`: pronósticos quedan congelados con el estado que tenían. Al setear nueva fecha (admin), se reabren pronósticos hasta el nuevo kickoff.
- `cancelled`: no suma puntos a nadie. Aparece como "anulado" en la UI.

## Importantes — defaults aplicados 🟡

| # | Pregunta | Default aplicado |
|---|---|---|
| 8 | Historial de pronósticos | Solo último valor (no se guarda historial de ediciones) |
| 9 | Score máximo permitido | 0-15 (validación en form + en API) |
| 10 | Jugador que no paga | Sigue jugando. La tabla muestra "✓ pagó" o "✗ debe" pública |
| 11 | Push notifications | NO. Solo mail (Resend) |
| 12 | Opt-out de mails | SÍ. Checkbox en `/profile`, default opt-in |
| 13 | Vista pronósticos ajenos | Se abre al kickoff exacto del partido |
| 14 | Monto del pozo | NO editable después del primer partido del torneo. Antes de eso, libre |
| 15 | Cron live polling | Ventanas calculadas del fixture (no 24/7). El cron consulta DB primero para saber si hay partido en vivo |

## Nice-to-have — pospuestas para v2 🟢

| # | Item | Estado |
|---|---|---|
| 16 | Audit log de correcciones de admin | Pospuesto |
| 17 | Snapshot histórico de la tabla | Pospuesto |
| 18 | Si nadie acierta el goleador, reparto del bonus | Pospuesto. Default: nadie cobra |

## Próximo paso

Actualizar `spec.md` con las decisiones resueltas, luego pasar a `/speckit-constitution` (no hay código aún) para fijar convenciones del proyecto antes de `/speckit-plan`.
