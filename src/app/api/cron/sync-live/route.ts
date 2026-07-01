import { NextResponse } from "next/server";
import { syncLive } from "@/server/sync/sync-live";
import { reconcilePoints } from "@/server/scoring/reconcile";
import { env } from "@/lib/env";

// Vercel cron lo invoca cada 3 min (ver vercel.json).
// Bearer auth con CRON_SECRET para que solo Vercel lo pueda invocar.
// Si CRON_SECRET está vacío, el cron sigue funcionando pero queda abierto a
// llamadas manuales (útil en dev para forzar sync con curl).

async function handle(req: Request) {
  if (env.CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await syncLive();

    // Chequeo de consistencia de puntos (auto-corrige el drift de matches ya
    // finished cuyo score cambió sin re-scorear). Barato y sin llamadas a la
    // API; un fallo acá no debe tumbar el sync.
    let reconcile: {
      checkedPredictions: number;
      fixed: number;
      mismatches: number;
    } | null = null;
    try {
      const r = await reconcilePoints();
      reconcile = {
        checkedPredictions: r.checkedPredictions,
        fixed: r.fixed,
        mismatches: r.mismatches.length,
      };
      if (r.fixed > 0) {
        console.warn(
          `[cron/sync-live] reconcile corrigió ${r.fixed} predicciones:`,
          JSON.stringify(r.mismatches),
        );
      }
    } catch (e) {
      console.error("[cron/sync-live] reconcile error:", e);
    }

    return NextResponse.json({ ok: true, ...result, reconcile });
  } catch (err) {
    console.error("[cron/sync-live] error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}

// QStash hace POST por default; tambien aceptamos GET para health checks manuales.
export const GET = handle;
export const POST = handle;
