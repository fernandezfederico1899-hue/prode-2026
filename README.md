# Prode 2026

Prode privado del Mundial 2026 para un grupo cerrado de amigos.

## Stack

- **Framework:** Next.js 16 (App Router + Cache Components)
- **DB:** Neon Postgres (vía Vercel Marketplace)
- **Auth:** NextAuth con Google provider
- **UI:** Tailwind CSS + shadcn/ui
- **Mail:** Resend (recordatorios de pronóstico)
- **Hosting:** Vercel (free tier)
- **Datos fútbol:**
  - Fixture: [openfootball/worldcup.json](https://github.com/openfootball/worldcup.json) (público, sin API key)
  - Resultados en vivo: [API-Sports](https://www.api-football.com/) plan free (100 req/día)

## Cómo funciona

- Login con Google, acceso restringido por whitelist
- Cada jugador carga su pronóstico (score) por partido hasta el kickoff
- Sistema clásico **3/1**: 3 pts resultado exacto, 1 pt signo acertado
- Pronósticos especiales pre-torneo (campeón, goleador, etc) con bonus
- Pozo único: todos ponen plata, ganador se lleva todo

## Estado

🚧 En spec — ver [specs/spec.md](./specs/spec.md)

## Deadline

11/06/2026 — kickoff del Mundial.
