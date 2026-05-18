# Visual Design — Prode 2026

> Lenguaje visual del proyecto. Cada componente que se diseñe/codee debe respetar estos lineamientos. Si rompemos una regla a propósito, lo discutimos.

**Mood elegido:** Retro mundialero, inspirado en álbumes Panini (Mexico 86, Italia 90, USA 94).
**Dark mode:** sí, ambos con toggle del usuario.
**Tone & voice:** neutral amigable, español argentino sin slang fuerte.
**Banderas:** SVG vía librería `flag-icons` (o equivalente).

---

## 1. Mood board y referencias

El feeling que buscamos:
- **Sticker en álbum:** cada card tiene presencia, bordes definidos, sensación de "objeto coleccionable".
- **Colores saturados pero no neon:** rojos profundos, azules marinos, dorados/foil (no amarillo plano), cremas/blancos no puros.
- **Tipografía con peso:** títulos chunky, números bold. Nada delgado/airy.
- **Detalles vintage:** patrones geométricos sutiles (chevron, líneas paralelas), badges/escudos, esquinas levemente redondeadas pero no flat (suficiente curvatura para sentir un sticker).
- **Patina:** levemente envejecido pero no roto. Sin filtros tipo "instagram vintage" — más bien colores correctos, sin efectos.

**Referencias concretas:**
- Tapa del álbum Panini Mexico 86 (los colores)
- App de FIFA+ (la jerarquía pero no la frialdad)
- Coffee table books de Panini (la edición de stickers)
- ✋ NO: estilo Linear/Vercel (demasiado moderno-frío)
- ✋ NO: estilo Twitch/discord (demasiado neón-joven)

---

## 2. Paleta de colores

Variables semánticas (siguiendo convención shadcn / Tailwind 4). Los valores HSL están propuestos — afinamos después si los vemos en pantalla y no quedan.

### Light mode

| Token | Valor | Uso |
|---|---|---|
| `--background` | `hsl(38 33% 96%)` | Crema/parchment. Fondo de todo |
| `--foreground` | `hsl(220 30% 12%)` | Azul muy oscuro casi negro. Texto principal |
| `--card` | `hsl(0 0% 100%)` | Blanco puro. Cards/stickers que se destacan del fondo |
| `--card-foreground` | `hsl(220 30% 12%)` | Texto en cards |
| `--primary` | `hsl(355 78% 42%)` | **Rojo Panini.** Acciones primarias, links, highlights |
| `--primary-foreground` | `hsl(0 0% 100%)` | Texto sobre primary |
| `--secondary` | `hsl(220 50% 22%)` | **Azul marino.** Acciones secundarias, headers de sección |
| `--secondary-foreground` | `hsl(0 0% 100%)` | Texto sobre secondary |
| `--accent` | `hsl(43 70% 52%)` | **Dorado foil.** Estados especiales (primer puesto, exacto acertado) |
| `--accent-foreground` | `hsl(220 30% 12%)` | Texto sobre accent |
| `--muted` | `hsl(38 20% 88%)` | Fondos de secciones secundarias |
| `--muted-foreground` | `hsl(220 15% 40%)` | Texto secundario |
| `--border` | `hsl(220 20% 80%)` | Bordes generales |
| `--destructive` | `hsl(0 70% 45%)` | Errores |
| `--ring` | `hsl(355 78% 42%)` | Focus ring (mismo que primary) |

### Dark mode

| Token | Valor | Uso |
|---|---|---|
| `--background` | `hsl(220 35% 8%)` | Azul marino muy oscuro |
| `--foreground` | `hsl(38 30% 92%)` | Crema cálida (no blanco puro, sigue Panini) |
| `--card` | `hsl(220 30% 13%)` | Cards levemente más claras que el fondo |
| `--primary` | `hsl(355 65% 55%)` | Rojo más brillante para dark mode |
| `--secondary` | `hsl(220 40% 30%)` | Azul un poco más claro para destacar |
| `--accent` | `hsl(43 80% 60%)` | Dorado más brillante (efecto foil más fuerte) |
| `--muted` | `hsl(220 25% 18%)` | |
| `--muted-foreground` | `hsl(220 10% 65%)` | |
| `--border` | `hsl(220 20% 25%)` | |

### Colores semánticos adicionales (para estados)

| Token | Light | Dark | Uso |
|---|---|---|---|
| `--correct-exact` | `hsl(43 70% 52%)` | `hsl(43 80% 60%)` | Acertaste exacto (= accent dorado) |
| `--correct-sign` | `hsl(140 50% 40%)` | `hsl(140 50% 55%)` | Acertaste signo (verde) |
| `--wrong` | `hsl(0 60% 45%)` | `hsl(0 60% 55%)` | Erraste |
| `--pending` | `hsl(220 10% 55%)` | `hsl(220 10% 60%)` | No cargaste / pendiente |
| `--live` | `hsl(0 90% 50%)` | `hsl(0 90% 55%)` | Partido en vivo (rojo brillante, pulse animation) |

---

## 3. Tipografía

**Filosofía:** dos familias. Una **chunky/condensed** para títulos y números (vibra Panini). Una **legible/neutra** para cuerpo de texto.

### Familias

| Rol | Fuente | Fallback |
|---|---|---|
| **Display / Titulos / Scores** | **Bebas Neue** (Google Fonts) | `Impact, "Arial Narrow", sans-serif` |
| **Body / UI** | **Inter** (Google Fonts) | `system-ui, -apple-system, sans-serif` |
| **Numbers tabulares** (tablas, posiciones) | **Inter** con `font-variant-numeric: tabular-nums` | — |

**¿Por qué Bebas Neue?**
- Condensed, alta densidad, **gritona** sin ser ofensiva.
- Vibra retro deportiva (mucho cartel de estadio antiguo).
- Free, en Google Fonts, performante via `next/font`.

**Alternativas si Bebas no convence al verlo en pantalla:**
- Anton (parecida pero más severa)
- Archivo Black (más sans-serif tradicional, menos retro)
- Oswald (similar, un toque más moderno)

### Escala tipográfica

| Token | Tamaño | Line height | Peso | Familia |
|---|---|---|---|---|
| `h1` | 3rem (48px) / 4rem (64px) lg | 1 | 400 | Bebas |
| `h2` | 2rem (32px) / 2.5rem (40px) lg | 1.1 | 400 | Bebas |
| `h3` | 1.5rem (24px) | 1.2 | 400 | Bebas |
| `score-xl` (scores grandes en match detail) | 4rem (64px) / 6rem (96px) lg | 1 | 400 | Bebas |
| `score-md` (scores en cards) | 2rem (32px) | 1 | 400 | Bebas |
| `body` | 1rem (16px) | 1.5 | 400 | Inter |
| `body-bold` | 1rem (16px) | 1.5 | 600 | Inter |
| `small` | 0.875rem (14px) | 1.5 | 400 | Inter |
| `caption` | 0.75rem (12px) | 1.4 | 500 | Inter |

**Nota mobile:** los `h1` no bajan a menos de 2.5rem (40px) en mobile. Los `score-xl` no bajan a menos de 3rem (48px). Queremos que se sientan grandes.

---

## 4. Iconografía

- **Lucide-react** (default de shadcn) para acciones (edit, trash, check, etc).
- **Banderas:** SVG vía `flag-icons` (npm) o `country-flag-icons`. Decisión final en `/speckit-plan` después de probar bundle size de cada uno.
- **Custom illustrations:** un solo logo / trofeo para la landing y para el ganador. Idealmente lo dibujo yo (o vos) — vibra retro Panini, geometric, no demasiado realista.

**Reglas:**
- Tamaño de íconos default: 20px (`size-5`).
- En tap targets (botones): el ícono mismo es 20px pero el botón es 44×44 mínimo.
- En badges/badges chicos: 14px.
- Color del ícono: heredan `currentColor`. Nunca hardcoded.

---

## 5. Patrones de componentes

### 5.1 MatchCard (la entidad visual más importante)

```
┌─────────────────────────────────────┐
│ ⏱ MAR 14:00          GRUPO C         │
│                                      │
│  🇦🇷 ARGENTINA          2            │
│  🇧🇷 BRASIL             1            │
│                                      │
│ ─────────────────────────────────── │
│ Tu pronóstico: 2-1 ✓ EXACTO +3      │
└─────────────────────────────────────┘
```

**Reglas visuales:**
- Borde más grueso (`border-2`) y `rounded-lg` (no demasiado redondo, no totalmente cuadrado).
- Padding generoso (`p-4 md:p-6`).
- Si el partido está `live`: borde rojo + indicador pulsante "EN VIVO".
- Si está `finished` y acertaste exacto: borde dorado + badge dorado en la esquina.
- Banderas: SVG `w-8 h-6` con leve `border` para sentir el sticker.
- Score: Bebas tipografía, alineación a la derecha, big.
- "Tu pronóstico" en `--muted-foreground`, con badge de resultado al lado.

### 5.2 LeaderboardRow

**Desktop (tabla tradicional):**
```
┌─────┬──────────────┬───────┬─────────┬────────┬────────┐
│  #  │ Jugador      │ Puntos │ Exactos │ Signos │ ❌   │
├─────┼──────────────┼───────┼─────────┼────────┼────────┤
│  🥇 │ Federico     │   42  │   8     │  12    │   3    │
│  🥈 │ Manuel       │   38  │   7     │  11    │   4    │
│  🥉 │ Juan         │   35  │   6     │  12    │   4    │
│  4  │ Diego        │   30  │   5     │  10    │   5    │
└─────┴──────────────┴───────┴─────────┴────────┴────────┘
```

**Mobile (cards apiladas, no scroll horizontal):**
```
┌──────────────────────────┐
│ 🥇 FEDERICO              │
│ 42 puntos                │
│ 8 exactos · 12 signos    │
└──────────────────────────┘
┌──────────────────────────┐
│ 🥈 MANUEL                │
│ ...                      │
```

**Reglas:**
- Top 3: medallas (emoji o ícono custom) + borde dorado/plateado/bronce.
- Tabular nums para que los números alineen.
- Nombre en Bebas, números grandes también.
- Posición compartida (empate): "1° (empate)" en lugar de un solo número.

### 5.3 Score input (form de pronóstico)

**Mobile:**
```
   🇦🇷 ARGENTINA       🇧🇷 BRASIL
   ┌────┐               ┌────┐
   │  2 │       VS      │  1 │
   └────┘               └────┘
   [- 0 +]              [- 0 +]
```

- Inputs grandes (`text-4xl` en Bebas), centrados.
- `inputMode="numeric"`.
- Botones `+ / -` debajo para incrementar (tap targets de 48px). Especialmente útil en mobile.
- Submit button BIG, `--primary`, ocupa el ancho.

### 5.4 Status badges

| Estado | Visual |
|---|---|
| Pronóstico cargado | Badge verde "✓ Cargado" |
| Sin cargar (con tiempo) | Badge gris "Pendiente" |
| Cierre próximo (< 1h) | Badge rojo pulsante "⚠ Cierra pronto" |
| Cerrado sin cargar | Badge gris "Sin cargar" |
| Exacto acertado | Badge dorado foil "+3 EXACTO" |
| Signo acertado | Badge verde "+1 Signo" |
| Errado | Badge rojo "0 pts" |

Todos con tipografía Bebas para los números.

---

## 6. Patrones de fondo y texturas

Para reforzar el feeling Panini sin ser cargante:

- **Patrón sutil en la landing y en backgrounds de sección:** chevron/diagonal stripes muy suaves (5% opacity sobre `--muted`). NO ruido, NO grano.
- **Cards no llevan textura.** Son limpias, dependen del borde + colores.
- **Header / hero de landing:** patrón geométrico más visible (10% opacity) con el logo del torneo encima.

CSS:
```css
.panini-pattern {
  background-image: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 10px,
    hsl(var(--muted-foreground) / 0.05) 10px,
    hsl(var(--muted-foreground) / 0.05) 11px
  );
}
```

---

## 7. Microinteracciones

**Filosofía:** sutiles, no gratuitas. Cada animación tiene un propósito.

### Permitidas
- **Hover en cards:** `scale-[1.02]` con `transition` 150ms. Sutil pero confirma interactividad.
- **Submit success:** el "sticker" del pronóstico aparece con un sutil pop (`scale 0 → 1` con bounce, 300ms).
- **Live partido:** dot rojo `pulse` animation (Tailwind built-in).
- **Score reveal post-kickoff:** los pronósticos de otros jugadores aparecen con un stagger (cada uno con 50ms delay), efecto "destapando el sticker".
- **Acerto exacto:** confetti dorado **solo una vez por acierto** (no en cada visita). Librería: `canvas-confetti` (~6kb).
- **Ganador del torneo:** trophy animation con shimmer dorado. Algo special, una vez por torneo.

### Prohibidas
- Page transitions globales (gratuitos, slow).
- Hover effects fuera de elementos clickeables.
- Animaciones de loading que tarden más de 200ms (preferir skeletons estáticos).

### Tooling
- **Framer Motion?** Requiere decisión (la constitution lo marca como "requiere discusión"). Solo necesario si hacemos animaciones complejas (drag, layout). Para lo de arriba, CSS Tailwind + `transition` alcanza. **Default: no instalar Framer Motion.** Revisamos cuando aparezca un caso real.

---

## 8. Estados especiales

### Loading
- **Skeletons** (no spinners). shadcn `<Skeleton>` con `--muted` color.
- En la tabla: skeleton de 5 filas que reemplaza la tabla real.
- En match detail: skeleton del score grande + texto secundario.

### Empty states
Cada empty state tiene 3 elementos:
1. Ilustración o emoji grande (ej ⚽ 🏆 📭).
2. Título Bebas en `h2`.
3. Subtítulo Inter explicando + acción si corresponde.

Ejemplos:
- Sin pronósticos cargados: "TODAVÍA NO JUGASTE" + "Cargá tu primer pronóstico" + [Botón → Pronósticos]
- Tabla vacía (pre-torneo): "EL MUNDIAL TODAVÍA NO EMPEZÓ" + "Volvé el 11/06 cuando arranquen los partidos" + sin botón

### Error states
- Genéricos: "ALGO SALIÓ MAL" + "Recargá la página o intentá más tarde" + botón "Reintentar".
- No exponemos stack traces ni mensajes técnicos al usuario.
- Sentry / Vercel logs capturan el error real para nosotros.

---

## 9. Voice & tone

**Voz:** neutral amigable, español argentino sin slang fuerte ("dale" sí; "boludo" no; "amigo" sí; "capo" en algún lugar puntual con humor sí).

**Reglas de copy:**
- Tutear ("vos"), no "usted".
- Verbos en imperativo amigable: "Cargá tu pronóstico", "Mirá la tabla".
- Sin emojis en copy formal de la app (excepto medallas en leaderboard y dot live).
- **NO**:
  - "Confirma tu apuesta"
  - "Submit prediction"
  - "Bienvenido estimado usuario"
- **SÍ**:
  - "Cargar pronóstico"
  - "Vas primero ✨" / "Vas primero"
  - "¡Acertaste el exacto!" (acá sí emoción)
  - "Falta una hora para que cierre"

**Mensajes de error:** claros, sin dramatismo.
- ❌ "Error 500: internal server failure"
- ✅ "No pudimos guardar tu pronóstico. Probá de nuevo."

---

## 10. Responsive específico de cada feature

(Detalles ya en constitución sección 13. Acá listamos solo lo específico del visual.)

| Feature | Mobile | Desktop |
|---|---|---|
| Leaderboard | Cards apiladas | Tabla tradicional |
| Match card | Vertical, score a la derecha | Horizontal, score grande al centro |
| Match detail | Score gigante centrado arriba, pronósticos abajo | Score izquierda, lista de pronósticos a la derecha |
| Form de pronóstico | Inputs grandes con +/- buttons | Inputs medianos, sin +/- (o opcionales) |
| Nav | Bottom tab bar (4 íconos) | Top nav o sidebar |
| Admin | Tablas con scroll horizontal contenido | Tablas completas |

---

## 11. Dark mode toggle

- Toggle en el header o en el perfil. Ícono: 🌙 / ☀️ (Lucide `moon` / `sun`).
- Persistencia: `localStorage` + `next-themes` (librería estándar para Next.js).
- Default: respeta `prefers-color-scheme` del sistema.
- Transición entre modos: 100ms ease (sutil, no fade dramático).

---

## 12. Accesibilidad

Mismo nivel que cualquier app profesional (WCAG AA mínimo):
- Contraste de texto: AAA en body, AA en headlines decorativos.
- Focus visible siempre (anillo `--ring` de 2px).
- Navegación por teclado funcional en todas las pantallas.
- `alt` text en banderas e imágenes.
- `aria-label` en botones de solo ícono.
- Sin contenido que dependa SOLO del color (ej "los exactos en verde, los signos en amarillo" → siempre + texto/badge).

---

## 13. Output de este doc

Una vez aprobado este doc, **antes de codear** se hace en orden:
1. Setup de Tailwind con la paleta + tipografías via `next/font` (parte del `/speckit-plan`).
2. **Mockups** (manuales en Excalidraw o Figma, o el mismo Claude puede generar ASCII / componentes de referencia) de las 4-5 pantallas clave: Home, Pronósticos, Tabla, Match detail, Admin. **Antes de implementar.**
3. Cada componente que se codea referencia este doc para sus decisiones visuales.

Si en el camino una decisión visual no está cubierta acá, se agrega antes de codearla.

---

## Decisiones que faltan (no bloquean el plan)

- Logo / wordmark del torneo (¿lo dibujás vos? ¿Generamos con AI?).
- Foto/ilustración de hero en la landing (opcional).
- ¿Necesitamos onboarding visual la primera vez que un user entra?
- ¿Vamos a tener algún easter egg o detalle de personalidad (ej "modo retro" extra de Panini)?

Lo veremos cuando lleguemos.
