// E2E test: valida DB, endpoints, assets, OAuth, Blob, build.
// Uso: node scripts/e2e-test.mjs [URL_BASE]
import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config({ path: ".env.local" });

const BASE = process.argv[2] ?? "https://prode-amigos-2026.vercel.app";
const sql = neon(process.env.DATABASE_URL);

let pass = 0;
let fail = 0;
const failures = [];

function ok(label, detail = "") {
  pass++;
  console.log(`  ✓ ${label}${detail ? ` — ${detail}` : ""}`);
}
function ko(label, reason) {
  fail++;
  failures.push(`${label}: ${reason}`);
  console.log(`  ✗ ${label} — ${reason}`);
}

async function section(name, fn) {
  console.log(`\n=== ${name} ===`);
  await fn();
}

async function fetchStatus(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, { redirect: "manual", ...opts });
  return { status: r.status, headers: r.headers, location: r.headers.get("location") };
}

// ============================================================
await section("1. DB content (Neon)", async () => {
  try {
    const [{ count: teamCount }] = await sql`SELECT count(*)::int FROM teams`;
    teamCount >= 48 ? ok("teams seedeados", `${teamCount}`) : ko("teams seedeados", `solo ${teamCount}, esperaba 48`);

    const [{ count: matchCount }] = await sql`SELECT count(*)::int FROM matches`;
    matchCount >= 72 ? ok("matches seedeados", `${matchCount}`) : ko("matches seedeados", `solo ${matchCount}, esperaba 72`);

    const [{ count: groupMatchCount }] = await sql`SELECT count(*)::int FROM matches WHERE stage = 'group'`;
    groupMatchCount === 72 ? ok("matches grupo", `${groupMatchCount}`) : ko("matches grupo", `${groupMatchCount}`);

    const [{ count: groupCount }] = await sql`SELECT count(DISTINCT group_letter)::int FROM teams WHERE group_letter IS NOT NULL`;
    groupCount === 12 ? ok("grupos distintos", "12") : ko("grupos distintos", `${groupCount}`);

    const config = await sql`SELECT * FROM tournament_config WHERE id = 1`;
    config.length === 1 ? ok("tournament_config singleton") : ko("tournament_config", "missing");

    const [{ count: matchesWithKickoff }] = await sql`SELECT count(*)::int FROM matches WHERE kickoff_at IS NOT NULL`;
    matchesWithKickoff === matchCount ? ok("todos los matches tienen kickoff") : ko("kickoff_at", `${matchesWithKickoff}/${matchCount}`);

    const [{ count: matchesWithVenue }] = await sql`SELECT count(*)::int FROM matches WHERE venue IS NOT NULL`;
    matchesWithVenue === matchCount ? ok("todos los matches tienen venue") : ko("venue", `${matchesWithVenue}/${matchCount}`);

    const [{ count: orphanMatches }] = await sql`SELECT count(*)::int FROM matches m WHERE NOT EXISTS (SELECT 1 FROM teams t WHERE t.id = m.home_team_id) OR NOT EXISTS (SELECT 1 FROM teams t WHERE t.id = m.away_team_id)`;
    orphanMatches === 0 ? ok("FK integrity matches→teams") : ko("FK matches→teams", `${orphanMatches} huerfanos`);

    const [{ count: dupTeams }] = await sql`SELECT count(*)::int FROM (SELECT fifa_code FROM teams GROUP BY fifa_code HAVING count(*) > 1) t`;
    dupTeams === 0 ? ok("no hay teams duplicados") : ko("teams dups", `${dupTeams}`);

    // Schema integrity: las 13 tablas existen
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
    const expected = ["accounts", "admin_audit_log", "matches", "payments", "players", "predictions", "sent_notifications", "sessions", "special_predictions", "teams", "tournament_config", "users", "verification_tokens"];
    const got = tables.map((t) => t.table_name);
    const missing = expected.filter((e) => !got.includes(e));
    missing.length === 0 ? ok("13 tablas esperadas", got.length.toString()) : ko("tablas", `faltan ${missing.join(",")}`);
  } catch (e) {
    ko("DB content", e.message);
  }
});

// ============================================================
await section("2. Auth gate (rutas protegidas → 307 /login)", async () => {
  const protectedPaths = [
    "/", "/predict", "/matches", "/groups", "/leaderboard",
    "/specials", "/champion", "/bracket", "/profile",
    "/admin", "/admin/users", "/admin/matches", "/admin/config",
    "/admin/payments", "/admin/audit",
  ];
  for (const p of protectedPaths) {
    const r = await fetchStatus(p);
    if (r.status === 307 && r.location?.endsWith("/login")) {
      ok(`${p} → /login`, "307");
    } else {
      ko(p, `status ${r.status}, loc=${r.location}`);
    }
  }
});

// ============================================================
await section("3. Rutas públicas (200)", async () => {
  for (const p of ["/login", "/pending", "/rejected"]) {
    const r = await fetchStatus(p);
    r.status === 200 ? ok(p, "200") : ko(p, `${r.status}`);
  }
});

// ============================================================
await section("4. API auth endpoints", async () => {
  const providers = await fetch(`${BASE}/api/auth/providers`).then((r) => r.json());
  providers.google ? ok("provider google registrado") : ko("provider google", "missing");

  const csrf = await fetch(`${BASE}/api/auth/csrf`).then((r) => r.json());
  csrf.csrfToken?.length > 20 ? ok("CSRF token endpoint", `${csrf.csrfToken.length} chars`) : ko("csrf", "invalid");

  const session = await fetch(`${BASE}/api/auth/session`).then((r) => r.json());
  session === null || Object.keys(session ?? {}).length === 0
    ? ok("session sin cookie no expone data", session === null ? "null" : "{}")
    : ko("session", JSON.stringify(session));

  // Callback de Google: el endpoint debe existir aunque rechace sin params
  const cb = await fetchStatus("/api/auth/callback/google");
  [302, 400, 500].includes(cb.status) ? ok("callback/google endpoint vivo", `${cb.status}`) : ko("callback", `${cb.status}`);

  // signin endpoint
  const signin = await fetchStatus("/api/auth/signin");
  [200, 302].includes(signin.status) ? ok("signin endpoint vivo", `${signin.status}`) : ko("signin", `${signin.status}`);
});

// ============================================================
await section("5. Assets estáticos", async () => {
  // Icon (favicon)
  const icon = await fetch(`${BASE}/icon`);
  icon.status === 200 && icon.headers.get("content-type")?.startsWith("image/")
    ? ok("favicon /icon", icon.headers.get("content-type"))
    : ko("icon", `${icon.status} ${icon.headers.get("content-type")}`);

  // Fonts y CSS los pone Next con hash, los probamos vía la pagina /login
  const loginHtml = await fetch(`${BASE}/login`).then((r) => r.text());
  loginHtml.includes("font-display") || loginHtml.includes("Bebas") || loginHtml.includes("bebas")
    ? ok("font Bebas referenciada en /login")
    : ko("font Bebas", "no se vio en HTML");
  /PRODE[\s\S]{0,100}2026/.test(loginHtml) && loginHtml.includes("MUNDIAL · USA · CANADÁ · MÉXICO")
    ? ok("hero /login render OK")
    : ko("titulo /login", "missing");

  // CSS chunk
  const cssMatch = loginHtml.match(/href="(\/_next\/static\/[^"]+\.css)"/);
  if (cssMatch) {
    const cssRes = await fetch(`${BASE}${cssMatch[1]}`);
    cssRes.status === 200 ? ok("CSS chunk carga", cssMatch[1].slice(-40)) : ko("CSS", `${cssRes.status}`);
  } else {
    ko("CSS link", "no se encontro en HTML");
  }
});

// ============================================================
await section("6. Vercel Blob (avatares)", async () => {
  const users = await sql`SELECT id, email, image FROM users WHERE image IS NOT NULL`;
  if (users.length === 0) {
    ok("no hay avatars subidos todavia", "skip");
  } else {
    for (const u of users.slice(0, 5)) {
      if (!u.image.startsWith("http")) {
        ko(`avatar de ${u.email}`, "no es URL http(s)");
        continue;
      }
      const r = await fetch(u.image, { method: "HEAD" });
      r.status === 200 && r.headers.get("content-type")?.startsWith("image/")
        ? ok(`avatar de ${u.email.split("@")[0]}`, r.headers.get("content-type"))
        : ko(`avatar de ${u.email}`, `${r.status}`);
    }
  }
});

// ============================================================
await section("7. Headers de seguridad", async () => {
  const r = await fetch(`${BASE}/login`);
  const expected = {
    "x-frame-options": "DENY",
    "x-content-type-options": "nosniff",
    "strict-transport-security": /max-age=/,
    "referrer-policy": /strict-origin/,
    "permissions-policy": /camera/,
  };
  for (const [k, v] of Object.entries(expected)) {
    const got = r.headers.get(k);
    const match = v instanceof RegExp ? v.test(got ?? "") : got === v;
    match ? ok(`header ${k}`, got) : ko(`header ${k}`, `got "${got}"`);
  }
});

// ============================================================
await section("8. Integridad de FKs (sample)", async () => {
  const [{ count: orphanPreds }] = await sql`SELECT count(*)::int FROM predictions p WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id) OR NOT EXISTS (SELECT 1 FROM matches m WHERE m.id = p.match_id)`;
  orphanPreds === 0 ? ok("predictions FK integrity") : ko("preds FK", `${orphanPreds}`);

  const [{ count: badSpec }] = await sql`
    SELECT count(*)::int FROM special_predictions sp
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = sp.user_id)
  `;
  badSpec === 0 ? ok("special_predictions FK") : ko("special FK", `${badSpec}`);
});

// ============================================================
console.log("\n" + "=".repeat(50));
console.log(`Total: ${pass} ✓  ${fail} ✗`);
if (fail > 0) {
  console.log("\nFalló:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log("\n✓ Todos los tests pasaron.\n");
