// Chequeo de consistencia de puntos: recalcula el `points` de cada pronóstico
// contra el score ACTUAL del match finalizado y detecta el drift (predicciones
// que quedaron con puntos viejos porque el score cambió después de scorear).
//
// Uso:
//   node --env-file=.env.local scripts/reconcile-points.mjs          (dry-run)
//   node --env-file=.env.local scripts/reconcile-points.mjs --apply  (corrige)
//
// El cron /api/cron/sync-live ya corre esto automáticamente en cada tick; este
// script es para verificar/forzar a mano.
import postgres from "postgres";

const APPLY = process.argv.includes("--apply");
const sql = postgres(process.env.DIRECT_URL ?? process.env.DATABASE_URL, {
  prepare: false,
});

// Mismo scoring que src/lib/scoring.ts: 3 exacto / 1 signo / 0 errado.
const calc = (ph, pa, mh, ma) =>
  ph === mh && pa === ma ? 3 : Math.sign(ph - pa) === Math.sign(mh - ma) ? 1 : 0;

try {
  const rows = await sql`
    SELECT p.id, p.points, p.home_score ph, p.away_score pa,
           u.name as user_name,
           m.home_score mh, m.away_score ma, m.match_num, m.stage,
           ht.name home, at.name away
    FROM predictions p
    JOIN matches m ON m.id = p.match_id
    JOIN users u ON u.id = p.user_id
    LEFT JOIN teams ht ON ht.id = m.home_team_id
    LEFT JOIN teams at ON at.id = m.away_team_id
    WHERE m.status = 'finished'
      AND m.home_score IS NOT NULL AND m.away_score IS NOT NULL`;

  const mism = [];
  for (const r of rows) {
    const expected = calc(r.ph, r.pa, r.mh, r.ma);
    if (expected !== r.points) mism.push({ ...r, expected });
  }

  console.log(`Predicciones chequeadas: ${rows.length}`);
  console.log(`Inconsistencias: ${mism.length}`);
  for (const m of mism) {
    console.log(
      `  ${m.user_name} | ${m.home} ${m.mh}-${m.ma} ${m.away} ` +
        `[${m.stage}${m.match_num ? " #" + m.match_num : ""}] | ` +
        `pred ${m.ph}-${m.pa} | persistido=${m.points} -> correcto=${m.expected}`,
    );
  }

  if (mism.length === 0) {
    console.log("\n✓ Todo consistente, nada que corregir.");
  } else if (!APPLY) {
    console.log("\n(dry-run) Corré con --apply para corregir.");
  } else {
    await sql.begin(async (tx) => {
      for (const m of mism) {
        await tx`UPDATE predictions SET points=${m.expected}, updated_at=now() WHERE id=${m.id}`;
      }
      await tx`INSERT INTO admin_audit_log (admin_email, action, target_type, target_id, payload_after)
        VALUES ('cli:reconcile', 'reconcile_points', 'predictions', 'batch',
          ${sql.json({ fixed: mism.length, mismatches: mism.map((m) => ({ predictionId: m.id, was: m.points, now: m.expected })) })})`;
    });
    console.log(`\n✅ ${mism.length} predicciones corregidas.`);
  }
} finally {
  await sql.end();
}
