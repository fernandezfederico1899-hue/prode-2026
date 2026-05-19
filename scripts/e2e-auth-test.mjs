// E2E test autenticado: genera una cookie de sesión válida con AUTH_SECRET
// y hace requests a las rutas protegidas verificando que devuelven contenido
// real (no redirigen al login).
import { neon } from "@neondatabase/serverless";
import { encode } from "next-auth/jwt";
import { config } from "dotenv";

config({ path: ".env.local" });

const BASE = process.argv[2] ?? "https://prode-amigos-2026.vercel.app";
const COOKIE_NAME = BASE.startsWith("https")
  ? "__Secure-authjs.session-token"
  : "authjs.session-token";
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

// ============================================================
// 1. Forjar cookie de sesión para el admin user real
// ============================================================
const adminRows = await sql`
  SELECT id, email, name FROM users
  WHERE email = ${process.env.ADMIN_EMAIL}
  LIMIT 1
`;
if (adminRows.length === 0) {
  console.error("✗ Admin user no existe en DB. Logueate primero.");
  process.exit(1);
}
const admin = adminRows[0];
console.log(`Usando admin: ${admin.email} (${admin.id})\n`);

const token = await encode({
  token: {
    sub: admin.id,
    id: admin.id,
    email: admin.email,
    name: admin.name,
    status: "approved",
    isAdmin: true,
  },
  secret: process.env.AUTH_SECRET,
  salt: COOKIE_NAME,
  maxAge: 60 * 60,
});

const cookie = `${COOKIE_NAME}=${token}`;

async function fetchAuth(path) {
  const r = await fetch(`${BASE}${path}`, {
    headers: { Cookie: cookie },
    redirect: "manual",
  });
  const body = await r.text();
  return { status: r.status, body, location: r.headers.get("location") };
}

// ============================================================
// 2. Cada ruta protegida debe dar 200 con contenido real
// ============================================================
console.log("=== Rutas protegidas con sesión válida ===");
const tests = [
  { path: "/", expect: /MUNDIAL 2026/ },
  { path: "/predict", expect: /MIS PRONÓSTICOS/ },
  { path: "/matches", expect: /PARTIDOS/ },
  { path: "/matches?view=status", expect: /PRÓXIMOS|EN VIVO|FINALIZADOS/ },
  { path: "/groups", expect: /FASE DE GRUPOS/ },
  { path: "/groups/a", expect: /GRUPO A/ },
  { path: "/groups/l", expect: /GRUPO L/ },
  { path: "/leaderboard", expect: /TABLA DE POSICIONES/ },
  { path: "/specials", expect: /PRONÓSTICOS ESPECIALES/ },
  { path: "/bracket", expect: /LLAVE/ },
  { path: "/champion", expect: /(LÍDER ACTUAL|GANÓ EL PRODE|MORTY|MUNDIAL)/i },
  { path: "/profile", expect: /PERFIL/ },
  { path: "/admin", expect: /DASHBOARD/ },
  { path: "/admin/users", expect: /USUARIOS/ },
  { path: "/admin/matches", expect: /PARTIDOS/ },
  { path: "/admin/config", expect: /CONFIG/ },
  { path: "/admin/payments", expect: /PAGOS/ },
  { path: "/admin/audit", expect: /AUDIT LOG/ },
];

for (const t of tests) {
  const r = await fetchAuth(t.path);
  if (r.status !== 200) {
    ko(t.path, `status ${r.status}${r.location ? ` → ${r.location}` : ""}`);
    continue;
  }
  if (!t.expect.test(r.body)) {
    ko(t.path, `200 pero contenido no matchea ${t.expect}`);
    continue;
  }
  ok(t.path, "200 + contenido OK");
}

// ============================================================
// 3. Verificar data real renderizada en /matches y /groups
// ============================================================
console.log("\n=== Data real en pages ===");
const matchesPage = await fetchAuth("/matches");
const teamCount = (matchesPage.body.match(/flagcdn\.com\/[a-z-]+\.svg/g) ?? []).length;
teamCount >= 100
  ? ok("flags renderizadas en /matches", `${teamCount} imgs`)
  : ko("flags en /matches", `solo ${teamCount}`);

const groupsPage = await fetchAuth("/groups");
// React renderiza {letter} en text-node separado, así que matcheamos el header
// del card por la class de Bebas.
const groupHeaders = (
  groupsPage.body.match(/font-display[^>]*>\s*GRUPO\s*</g) ?? []
).length;
groupHeaders === 12
  ? ok("12 group cards en /groups", `${groupHeaders}`)
  : ko("grupos en /groups", `solo ${groupHeaders}`);

const leaderboardPage = await fetchAuth("/leaderboard");
leaderboardPage.body.includes(admin.name)
  ? ok("mi nombre aparece en /leaderboard")
  : ko("/leaderboard", "mi nombre no aparece");

const profilePage = await fetchAuth("/profile");
profilePage.body.includes(admin.email)
  ? ok("mi email aparece en /profile")
  : ko("/profile", "email no aparece");

// ============================================================
// 4. /admin/users ve los users reales
// ============================================================
const adminUsers = await fetchAuth("/admin/users");
const userListed = adminUsers.body.includes(admin.name);
userListed
  ? ok("admin/users lista mi user")
  : ko("admin/users", "no encuentra users");

// ============================================================
// 5. API endpoints con sesión válida
// ============================================================
console.log("\n=== API endpoints con auth ===");
const sessionRes = await fetch(`${BASE}/api/auth/session`, {
  headers: { Cookie: cookie },
});
const sess = await sessionRes.json();
sess?.user?.id === admin.id
  ? ok("/api/auth/session devuelve mi user", admin.id.slice(0, 8))
  : ko("/api/auth/session", JSON.stringify(sess));

sess?.user?.isAdmin === true
  ? ok("session.user.isAdmin = true")
  : ko("isAdmin flag", JSON.stringify(sess?.user));

sess?.user?.status === "approved"
  ? ok("session.user.status = approved")
  : ko("status flag", sess?.user?.status);

// ============================================================
// 6. Cookie inválida → debe rechazar
// ============================================================
console.log("\n=== Defensa contra cookies forjadas ===");
const fakeRes = await fetch(`${BASE}/admin`, {
  headers: { Cookie: `${COOKIE_NAME}=junk_token_no_valido` },
  redirect: "manual",
});
fakeRes.status === 307 && fakeRes.headers.get("location")?.endsWith("/login")
  ? ok("cookie inválida → 307 /login")
  : ko("cookie inválida", `status ${fakeRes.status}`);

// ============================================================
console.log("\n" + "=".repeat(50));
console.log(`Total: ${pass} ✓  ${fail} ✗`);
if (fail > 0) {
  console.log("\nFalló:");
  for (const f of failures) console.log(`  - ${f}`);
  process.exit(1);
}
console.log("\n✓ Todos los tests autenticados pasaron.\n");
