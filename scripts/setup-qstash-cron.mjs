// Crea (o actualiza) el schedule de QStash que pega a /api/cron/sync-live
// cada 10 minutos. Idempotente: si ya existe, lo actualiza.
//
// Pre-requisitos:
//   - QSTASH_TOKEN en .env.local (https://console.upstash.com → QStash → Tokens)
//   - CRON_SECRET ya seteado (mismo que tiene Vercel prod)
//
// Uso:
//   node --env-file=.env.local scripts/setup-qstash-cron.mjs
//
// Por qué cada 10 min:
//   El cuello de botella NO es QStash (free = 500 msg/día) sino API-Football
//   (free = 100 req/día). A 10 min son 144 ticks/día y, con la ventana de juego
//   achicada en sync-live.ts, ~50-70 llamadas reales/día → cómodo bajo 100.
//   A 5 min nos pasábamos y suspendían la cuenta. La latencia extra (un gol
//   tarda hasta 10 min en reflejarse) es aceptable para un prode.

const TOKEN = process.env.QSTASH_TOKEN;
const CRON_SECRET = process.env.CRON_SECRET;
const TARGET_URL = "https://prode-amigos-2026.vercel.app/api/cron/sync-live";
const SCHEDULE_ID = "prode-2026-sync-live"; // ID estable para upsert
const CRON_EXPR = "*/10 * * * *";

if (!TOKEN) {
  console.error("Falta QSTASH_TOKEN en .env.local");
  console.error(
    "  → console.upstash.com → QStash → Tokens (copiar el QSTASH_TOKEN)",
  );
  process.exit(1);
}
if (!CRON_SECRET) {
  console.error("Falta CRON_SECRET en .env.local");
  process.exit(1);
}

async function listSchedules() {
  const res = await fetch("https://qstash-us-east-1.upstash.io/v2/schedules", {
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok) throw new Error(`list schedules HTTP ${res.status}`);
  return res.json();
}

async function deleteSchedule(id) {
  const res = await fetch(`https://qstash-us-east-1.upstash.io/v2/schedules/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${TOKEN}` },
  });
  if (!res.ok && res.status !== 404) {
    throw new Error(`delete schedule HTTP ${res.status}`);
  }
}

async function createSchedule() {
  const url = `https://qstash-us-east-1.upstash.io/v2/schedules/${TARGET_URL}`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
      // Cron expression
      "Upstash-Cron": CRON_EXPR,
      // Schedule ID estable (permite delete/recreate idempotente)
      "Upstash-Schedule-Id": SCHEDULE_ID,
      // QStash pasa este header al destino sin el prefijo "Upstash-Forward-"
      "Upstash-Forward-Authorization": `Bearer ${CRON_SECRET}`,
      // Reintentos: 0. Si un tick falla (ej. API caída/suspendida), NO reintentar:
      // el siguiente tick (5 min) ya cubre. Reintentar multiplicaba las llamadas
      // fallidas y agravó una suspensión de la cuenta API (2026-06-13).
      "Upstash-Retries": "0",
    },
    body: JSON.stringify({ source: "scripts/setup-qstash-cron.mjs" }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`create schedule HTTP ${res.status}: ${txt}`);
  }
  return res.json();
}

async function main() {
  console.log("Verificando schedules existentes...");
  const existing = await listSchedules();
  const ours = existing.filter(
    (s) =>
      s.scheduleId === SCHEDULE_ID ||
      s.destination === TARGET_URL ||
      s.destination?.includes("prode-amigos-2026"),
  );

  if (ours.length > 0) {
    console.log(`Encontrados ${ours.length} schedules previos. Borrando...`);
    for (const s of ours) {
      await deleteSchedule(s.scheduleId);
      console.log(`  borrado: ${s.scheduleId}`);
    }
  }

  console.log(`Creando schedule (${CRON_EXPR}) → ${TARGET_URL}`);
  const result = await createSchedule();
  console.log("\n✅ Schedule creado:");
  console.log(`  ID: ${result.scheduleId}`);
  console.log(`  Cron: ${CRON_EXPR}`);
  console.log(`  Target: ${TARGET_URL}`);
  console.log(`\nVerificación: https://console.upstash.com/qstash`);
}

main().catch((err) => {
  console.error("\n❌ Error:", err.message);
  process.exit(1);
});
