# Prode 2026

Prode del Mundial 2026 para un grupo cerrado de amigos. Lo armé porque los prodes
que hay o cobran, o se caen el día del partido, o te obligan a cargar el resultado
a mano. Este sincroniza solo y aguanta que la API de fútbol falle.

## Qué hace

- Login con Google, acceso por whitelist. El que no está en la lista queda en pendiente.
- Cada jugador carga su pronóstico por partido **hasta el kickoff**, no después.
- Puntaje clásico **3/1**: 3 puntos el resultado exacto, 1 punto el signo.
- Pronósticos especiales pre-torneo (campeón, goleador) con bonus.
- Tabla de posiciones, fase de grupos y **cuadro de playoffs que se propaga solo**:
  cuando termina un partido, el ganador aparece en el siguiente cruce.
- Panel de administración: partidos, usuarios, pagos del pozo, bonus, cuadro,
  configuración y auditoría.

## Lo que costó de verdad

**Sincronizar resultados sin poder confiar en la fuente.** La API de fútbol es plan
gratuito: 100 requests por día, y a veces devuelve un partido clavado en `scheduled`
cuando ya terminó, o pierde su ventana de sincronización. El job de sync tiene una red
de seguridad que reconcilia contra la API aunque no haya partidos en ventana, rescata
los que quedaron colgados y arregla los slots del cuadro que quedaron obsoletos.

**El puntaje de los playoffs.** Un 2-2 que se define por penales no puntúa igual que
un 2-2 en los 90. Se puntúa el resultado a los 90 más prórroga, y los penales definen
quién avanza en el cuadro, no el puntaje del pronóstico.

## Stack

- **Framework:** Next.js 16 (App Router + Cache Components)
- **Base:** Neon Postgres con Drizzle ORM
- **Auth:** NextAuth v5 con Google
- **UI:** Tailwind 4 + shadcn/ui
- **Mail:** Resend, para los recordatorios antes del kickoff
- **Jobs:** cron de Vercel para el sync en vivo
- **Hosting:** Vercel

Datos: fixture de [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json)
(público, sin API key) y resultados en vivo de [API-Sports](https://www.api-football.com/).

## Correrlo

```bash
pnpm install
cp .env.example .env.local    # completar las variables
pnpm db:push
pnpm dev
```

## Tests

```bash
pnpm test          # suites del cuadro de playoffs y del sync en vivo
pnpm typecheck
```

Las suites cubren la propagación del cuadro y la sincronización en vivo, que son las
dos partes donde un error se ve al toque y encima delante de todo el grupo.

## Diseño

La estética es retro Panini: rojo, azul marino y dorado, con Bebas Neue para los
títulos. Está documentada en [`specs/visual-design.md`](./specs/visual-design.md),
junto con el resto de las decisiones en `specs/`.

---

Hecho por [Federico Fernández García](https://www.linkedin.com/in/federico-fernandez-garcia-8297bb2b6).
