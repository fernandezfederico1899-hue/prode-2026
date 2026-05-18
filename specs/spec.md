# Spec: Prode Mundial 2026

> Estado: **CLARIFIED** — clarificaciones resueltas en [clarifications.md](./clarifications.md). Pendiente `/speckit-constitution` antes de `/speckit-plan`.

## Qué

Aplicación web mobile-first para que un grupo cerrado de ~15 amigos haga su prode privado del Mundial 2026. Cada jugador carga pronósticos por partido antes del kickoff, gana puntos según el sistema clásico 3/1, y compite en una tabla de posiciones. Incluye pronósticos especiales pre-torneo con bonus, sync automático de resultados con tracking en vivo, panel admin, recordatorios por mail y tracking del pozo en plata.

## Por qué

- Los prodes públicos (Promiedos, Mi Bolada) tienen reglas fijas y UI no editable.
- Federico quiere algo propio, controlado, con tracking de pagos del pozo y reglas custom (bonus por pronósticos especiales).
- Mundial 2026 arranca 11/06/2026 — hay ventana de ~3 semanas para tener algo funcional.
- Es un proyecto cerrado a 15 personas conocidas: simplifica auth (Google login), no requiere escala ni anti-fraude pesado.

## Para quién

- **Jugadores (~15):** amigos de Federico. Entran desde el celu, cargan pronósticos, miran tabla.
- **Admin (Federico):** invita jugadores, marca pagos del pozo, corrige resultados si la API se equivoca, configura el monto del pozo.

## Alcance

### Incluye

**Auth y usuarios**
- Login con Google (NextAuth)
- **Self-signup con aprobación:** cualquiera con cuenta Google puede registrarse. Queda en estado `pending` hasta que el admin lo apruebe desde `/admin/users`
- Admin identificado por env var `ADMIN_EMAIL=fernandezfederico1899@gmail.com`
- Estados de usuario: `pending | approved | rejected`
- Perfil mínimo (nombre, avatar de Google, equipo favorito opcional, checkbox opt-out de mails)

**Fixture y resultados**
- Seed inicial desde [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) (sin API key, público)
- Mapping openfootball ↔ API-Sports automático por `(kickoff_at ± 1h, home_team, away_team)` con normalización de nombres de equipos
- Estados de partido: `scheduled | live | finished | postponed | cancelled`
  - `postponed`: al setear nueva fecha desde admin, pronósticos se reabren hasta nuevo kickoff
  - `cancelled`: no suma puntos a nadie, se muestra "anulado"
- Sync de resultados en vivo vía API-Sports free tier:
  - Cron de Vercel cada 3 min, **solo en ventanas calculadas del fixture** (no 24/7)
  - El cron consulta DB primero: si no hay partido en estado `live` o próximo a empezar, no llama a API
  - Cuando hay live, usa `/fixtures?live=all` (1 req cubre todos los partidos simultáneos)
  - Logging de uso diario para alertar si se acerca al límite de 100 req/día
- Panel admin para corregir resultados manualmente (dispara recálculo de puntos)

**Pronósticos por partido**
- Carga de score (ej 2-1) hasta el kickoff. Rango válido: 0-15 por equipo
- Cierre automático al kickoff (timezone America/Argentina/Buenos_Aires)
- Edición libre hasta el cierre (solo se guarda el último valor, sin historial)
- Vista post-kickoff: pronósticos de todos los jugadores visibles al instante del kickoff
- Eliminatoria: partido por partido (se desbloquea cuando se definen los cruces)
- **Score en eliminatoria:** resultado a los 90 minutos reglamentarios. Alargue y penales NO cuentan para el prode. Si predijiste empate y se definió por penales, cobrás como empate.

**Pronósticos especiales (bonus pre-torneo)**
- Campeón: 20 pts
- Subcampeón: 10 pts
- Tercer puesto: 5 pts
- Goleador del torneo (Bota de Oro FIFA): 15 pts
- Mejor jugador del torneo (Balón de Oro FIFA): 10 pts
- País más goleador del torneo: 5 pts
- Cierre: kickoff del primer partido del torneo (11/06/2026)

Todos los bonus son **objetivos** (los define FIFA al final del torneo o se calculan automáticamente sumando goles).

**Sistema de puntaje (clásico 3/1)**
- 3 pts: resultado exacto
- 1 pt: signo acertado (gana local / empate / gana visitante)
- 0 pts: signo errado
- Bonus de pronósticos especiales se suman al cierre del torneo

**Tabla de posiciones**
- Ranking general en tiempo real
- Ranking por fase (grupos / octavos / cuartos / semis / final)
- Detalle por jugador: aciertos exactos, signos, errados, racha
- Desempates en orden:
  1. Puntos totales (desc)
  2. Cantidad de resultados exactos (desc)
  3. Cantidad de signos acertados (desc)
  4. **Si persiste el empate: posición compartida.** En caso de ser ganadores, el pozo se reparte en partes iguales (50/50 si son 2, 33/33/33 si son 3, etc).

**Pozo en plata**
- Monto por jugador configurable desde panel admin (en ARS)
- **El monto queda lockeado al kickoff del primer partido del torneo** (después no se puede editar)
- Admin marca quién pagó (checkbox)
- Lista pública con "✓ pagó" o "✗ debe" para cada jugador (transparencia)
- Jugadores que no pagaron siguen jugando (no se los saca de la tabla)
- Cálculo del pozo total en vivo (suma de pagados)
- Ganador final se lleva todo. Si hay empate en primer lugar, se reparte en partes iguales
- Pagos por fuera de la app (transferencias), la app solo trackea

**Notificaciones (Resend)**
- Mail 1h antes del kickoff si el jugador NO cargó pronóstico (respetando opt-out)
- Mail al finalizar cada fecha con resumen y nueva tabla
- Mail final con ganador y monto del pozo
- Cada jugador puede optar-out desde `/profile` (default: opt-in)
- No hay push notifications (solo mail)

**Panel admin**
- Aprobar/rechazar usuarios pendientes (`pending` → `approved` o `rejected`)
- Configurar monto del pozo (solo antes del primer kickoff del torneo)
- Marcar pagos
- Corregir resultados (dispara recálculo)
- Setear nueva fecha a partidos `postponed`
- Anular partidos (`cancelled`)
- Resolver bonus especiales al final del torneo (campeón, goleador, mejor jugador, etc) → dispara cálculo de bonus
- Forzar resync del fixture desde openfootball
- Ver logs de errores de sync y uso diario de API-Sports

### No incluye

- Multi-grupo (es un solo prode privado, no SaaS)
- Chat o comentarios dentro de la app (van por WhatsApp)
- Apuestas por fecha o sub-pozos (es pozo único final)
- App móvil nativa (solo web responsive)
- Stats avanzadas tipo "qué hubiera pasado si..."
- Integración con otros prodes o export externos
- Soporte multi-idioma
- Pagos online (las transferencias son por fuera)

## Restricciones

**Técnicas**
- Stack fijo: Next.js 16 (App Router + Cache Components) + Neon Postgres + NextAuth + Tailwind + shadcn/ui + Resend
- Hosting: Vercel free tier
- API resultados: API-Sports free plan (**100 req/día**)
- Fixture: openfootball/worldcup.json (sin API key)
- Cron de Vercel free: 2 crons + ejecución cada 1+ min (suficiente para polling de 3 min)
- DB: Neon free tier (0.5 GB, sobra)
- Timezone para cierres y notificaciones: `America/Argentina/Buenos_Aires`

**De tiempo**
- Deadline duro: **11/06/2026** (kickoff del Mundial)
- Pronósticos especiales deben estar cerrados antes del primer partido
- ~3 semanas de ventana para desarrollo + carga del fixture + pruebas

**De negocio**
- ~15 jugadores, whitelist cerrada
- Pozo en ARS, manejado por fuera (transferencias)
- Admin único (Federico) — multi-admin queda fuera de scope

**Seguridad**
- Solo emails de la whitelist entran
- Pronósticos inmutables después del kickoff (lock en DB + check de servidor)
- Panel admin protegido por rol (no por flag en UI)
- Tokens de API en env vars de Vercel
- No commitear secrets

**Presupuesto de API**
- Cabe en 100 req/día con polling de 3 min durante ventanas de partido + `/fixtures?live=all`
- Si en grupo final se roza el límite: upgrade a paid (~€19/mes solo el mes del Mundial)

## Criterios de aceptación

### Auth y acceso
- [ ] DADO cualquier email de Google CUANDO se loguea por primera vez ENTONCES se crea user con `status = pending` y ve pantalla "esperando aprobación"
- [ ] DADO un user `pending` CUANDO el admin lo aprueba ENTONCES su `status = approved` y puede acceder a la app
- [ ] DADO un user `pending` o `rejected` CUANDO intenta acceder a `/` o cualquier ruta de la app ENTONCES recibe la pantalla de espera
- [ ] DADO un jugador no-admin (cuyo email ≠ `ADMIN_EMAIL`) CUANDO accede a `/admin` ENTONCES recibe 403

### Pronósticos partidos
- [ ] DADO un partido futuro CUANDO el jugador carga un score (0-15 cada lado) ENTONCES se persiste y puede editarlo
- [ ] DADO un partido que ya empezó CUANDO el jugador intenta editar ENTONCES la API rechaza con 403 y la UI muestra "cerrado"
- [ ] DADO un partido finalizado CUANDO el resultado es 2-1 y el jugador predijo 2-1 ENTONCES gana 3 pts
- [ ] DADO un partido finalizado CUANDO el resultado es 2-1 y el jugador predijo 3-1 ENTONCES gana 1 pt
- [ ] DADO un partido finalizado CUANDO el resultado es 2-1 y el jugador predijo 0-2 ENTONCES gana 0 pts
- [ ] DADO un partido de KO que terminó 1-1 (90 min) y se definió por penales CUANDO el jugador predijo 1-1 ENTONCES gana 3 pts (penales no cuentan)
- [ ] DADO un partido `postponed` CUANDO el admin setea nueva fecha ENTONCES se reabren pronósticos para los jugadores hasta el nuevo kickoff
- [ ] DADO un partido `cancelled` CUANDO se recalcula la tabla ENTONCES no suma puntos a nadie

### Pronósticos especiales
- [ ] DADO que el torneo no empezó CUANDO el jugador carga sus 6 picks especiales (campeón/subcampeón/3ro/goleador/mejor jugador/país más goleador) ENTONCES se guardan
- [ ] DADO el kickoff del primer partido del torneo CUANDO el jugador intenta editar especiales ENTONCES recibe error
- [ ] DADO el torneo terminado y el admin resuelve los bonus CUANDO el campeón efectivo coincide con el pick del jugador ENTONCES gana 20 pts bonus
- [ ] DADO el torneo terminado CUANDO se calcula automáticamente el país más goleador (sumando goles por selección) ENTONCES los picks acertados ganan 5 pts bonus

### Sync de resultados
- [ ] DADO un partido en vivo CUANDO el cron corre cada 3 min ENTONCES actualiza el score parcial sin recalcular puntos
- [ ] DADO un partido finalizado por la API CUANDO el cron lo detecta ENTONCES marca `finalized = true` y dispara el cálculo de puntos
- [ ] DADO no hay partidos en vivo CUANDO el cron corre ENTONCES NO consume request a API-Sports
- [ ] DADO un resultado incorrecto en la API CUANDO el admin lo corrige en el panel ENTONCES recalcula los puntos de todos los jugadores afectados
- [ ] DADO el uso diario de API-Sports CUANDO supera 80 reqs ENTONCES el admin recibe alerta por mail

### Pozo
- [ ] DADO un jugador que pagó CUANDO el admin lo marca ENTONCES aparece "✓ pagó" en la tabla pública
- [ ] DADO N jugadores pagos CUANDO el monto configurado es $X ENTONCES el pozo total = N × X visible en el header
- [ ] DADO un admin antes del primer kickoff CUANDO cambia el monto del pozo ENTONCES se persiste y se refleja en toda la app
- [ ] DADO el primer kickoff ya ocurrido CUANDO el admin intenta cambiar el monto ENTONCES recibe error "pozo lockeado"
- [ ] DADO el torneo terminado con empate en 1er lugar entre 2 jugadores CUANDO se calcula el premio ENTONCES cada uno recibe 50% del pozo

### Notificaciones
- [ ] DADO un partido a las 16:00 ART CUANDO son las 15:00 ART y un jugador no cargó pronóstico ENTONCES recibe un mail
- [ ] DADO un jugador que ya cargó CUANDO falta 1h al partido ENTONCES NO recibe mail
- [ ] DADO un jugador con opt-out activado CUANDO falta 1h y no cargó ENTONCES NO recibe mail
- [ ] DADO el fin de una fecha CUANDO se procesan todos los partidos ENTONCES se envía mail con resumen y tabla (respetando opt-out)

### Vista pública post-kickoff
- [ ] DADO un partido que ya empezó CUANDO un jugador entra al detalle ENTONCES ve los pronósticos de todos los demás

### Tabla
- [ ] DADO 3 partidos finalizados CUANDO entro a la tabla ENTONCES veo a los jugadores ordenados por puntos totales descendente
- [ ] DADO empate en puntos CUANDO se ordena ENTONCES desempata por cantidad de resultados exactos, luego por signos acertados
- [ ] DADO empate en puntos, exactos Y signos CUANDO se renderiza la tabla ENTONCES los jugadores comparten la misma posición visible (ej "1° (empate)")

## Próximos pasos

1. ~~`/speckit-clarify`~~ ✅ resuelto (ver [clarifications.md](./clarifications.md))
2. ~~`/speckit-constitution`~~ ✅ resuelto (ver [constitution.md](./constitution.md))
3. ~~Architecture deep dive~~ ✅ resuelto (ver [architecture-deep-dive.md](./architecture-deep-dive.md))
4. ~~Visual design~~ ✅ resuelto (ver [visual-design.md](./visual-design.md))
5. `/speckit-plan` para diseño técnico (modelo de datos, rutas, componentes, orden de implementación)
6. Mockups de pantallas clave antes de codear (Home, Pronósticos, Tabla, Match detail, Admin)
7. `/speckit-tasks` para desglose en tareas accionables
8. `/speckit-implement` para codear
