# Spec: Prode Mundial 2026

> Estado: **DRAFT** — pendiente de pasar por `/speckit-clarify` antes de `/speckit-plan`.

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
- Whitelist por email: solo invitados pueden entrar
- Perfil mínimo (nombre, avatar de Google, equipo favorito opcional)

**Fixture y resultados**
- Seed inicial desde [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) (sin API key, público)
- Sync de resultados en vivo vía API-Sports free tier:
  - Polling cada **3 min** durante ventanas de partido usando `/fixtures?live=all` (1 req cubre todos los partidos en vivo)
  - Si no hay partidos en vivo, no se consume request
  - Logging de uso diario para detectar si se acerca al límite de 100 req/día
- Panel admin para corregir resultados manualmente (recalcula puntos)

**Pronósticos por partido**
- Carga de score (ej 2-1) hasta el kickoff
- Cierre automático al kickoff (timezone America/Argentina/Buenos_Aires)
- Edición libre hasta el cierre
- Vista post-kickoff: pronósticos de todos los jugadores visibles
- Eliminatoria: partido por partido (se desbloquea cuando se definen los cruces)

**Pronósticos especiales (bonus pre-torneo)**
- Campeón: 20 pts
- Subcampeón: 10 pts
- Tercer puesto: 5 pts
- Goleador del torneo: 15 pts
- Revelación (jugador): 10 pts
- Decepción (equipo): 5 pts
- Cierre: kickoff del primer partido del torneo (11/06/2026)

**Sistema de puntaje (clásico 3/1)**
- 3 pts: resultado exacto
- 1 pt: signo acertado (gana local / empate / gana visitante)
- 0 pts: signo errado
- Bonus de pronósticos especiales se suman al cierre del torneo

**Tabla de posiciones**
- Ranking general en tiempo real
- Ranking por fase (grupos / octavos / cuartos / semis / final)
- Detalle por jugador: aciertos exactos, signos, errados, racha
- Desempate: cantidad de resultados exactos > cantidad de signos acertados

**Pozo en plata**
- Monto por jugador configurable desde panel admin (en ARS)
- Admin marca quién pagó (checkbox)
- Lista pública de pagos al día (transparencia)
- Cálculo del pozo total en vivo
- Ganador final se lleva todo
- Pagos por fuera de la app (transferencias), la app solo trackea

**Notificaciones (Resend)**
- Mail 1h antes del kickoff si el jugador NO cargó pronóstico
- Mail al finalizar cada fecha con resumen y nueva tabla
- Mail final con ganador y monto del pozo

**Panel admin**
- Invitar/remover emails de whitelist
- Configurar monto del pozo
- Marcar pagos
- Corregir resultados (dispara recálculo)
- Forzar resync del fixture desde openfootball
- Ver logs de errores de sync y uso de API-Sports

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
- [ ] DADO un email NO invitado CUANDO intenta loguearse ENTONCES la app lo rechaza con mensaje claro
- [ ] DADO un email invitado CUANDO se loguea con Google por primera vez ENTONCES se crea su perfil automáticamente
- [ ] DADO un jugador no-admin CUANDO accede a `/admin` ENTONCES recibe 403

### Pronósticos partidos
- [ ] DADO un partido futuro CUANDO el jugador carga un score ENTONCES se persiste y puede editarlo
- [ ] DADO un partido que ya empezó CUANDO el jugador intenta editar ENTONCES la API rechaza con 403 y la UI muestra "cerrado"
- [ ] DADO un partido finalizado CUANDO el resultado es 2-1 y el jugador predijo 2-1 ENTONCES gana 3 pts
- [ ] DADO un partido finalizado CUANDO el resultado es 2-1 y el jugador predijo 3-1 ENTONCES gana 1 pt
- [ ] DADO un partido finalizado CUANDO el resultado es 2-1 y el jugador predijo 0-2 ENTONCES gana 0 pts

### Pronósticos especiales
- [ ] DADO que el torneo no empezó CUANDO el jugador carga sus 6 picks especiales ENTONCES se guardan
- [ ] DADO el kickoff del primer partido CUANDO el jugador intenta editar especiales ENTONCES recibe error
- [ ] DADO el torneo terminado CUANDO el campeón efectivo coincide con el pick del jugador ENTONCES gana 20 pts bonus

### Sync de resultados
- [ ] DADO un partido en vivo CUANDO el cron corre cada 3 min ENTONCES actualiza el score parcial sin recalcular puntos
- [ ] DADO un partido finalizado por la API CUANDO el cron lo detecta ENTONCES marca `finalized = true` y dispara el cálculo de puntos
- [ ] DADO no hay partidos en vivo CUANDO el cron corre ENTONCES NO consume request a API-Sports
- [ ] DADO un resultado incorrecto en la API CUANDO el admin lo corrige en el panel ENTONCES recalcula los puntos de todos los jugadores afectados
- [ ] DADO el uso diario de API-Sports CUANDO supera 80 reqs ENTONCES el admin recibe alerta por mail

### Pozo
- [ ] DADO un jugador que pagó CUANDO el admin lo marca ENTONCES aparece "✓ pagó" en la tabla pública
- [ ] DADO N jugadores pagos CUANDO el monto configurado es $X ENTONCES el pozo total = N × X visible en el header
- [ ] DADO un admin CUANDO cambia el monto del pozo ENTONCES se persiste y se refleja en toda la app

### Notificaciones
- [ ] DADO un partido a las 16:00 ART CUANDO son las 15:00 ART y un jugador no cargó pronóstico ENTONCES recibe un mail
- [ ] DADO un jugador que ya cargó CUANDO falta 1h al partido ENTONCES NO recibe mail
- [ ] DADO el fin de una fecha CUANDO se procesan todos los partidos ENTONCES se envía mail con resumen y tabla

### Vista pública post-kickoff
- [ ] DADO un partido que ya empezó CUANDO un jugador entra al detalle ENTONCES ve los pronósticos de todos los demás

### Tabla
- [ ] DADO 3 partidos finalizados CUANDO entro a la tabla ENTONCES veo a los jugadores ordenados por puntos totales descendente
- [ ] DADO empate en puntos CUANDO se ordena ENTONCES desempata por cantidad de resultados exactos, luego por signos acertados

## Próximos pasos

1. `/speckit-clarify` para resolver ambigüedades de implementación
2. `/speckit-plan` para diseño técnico (modelo de datos, rutas, componentes)
3. `/speckit-tasks` para desglose en tareas accionables
4. `/speckit-implement` para codear
