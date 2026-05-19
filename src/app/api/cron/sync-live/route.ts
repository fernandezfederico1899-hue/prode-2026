import { NextResponse } from "next/server";
import { syncLive } from "@/server/sync/sync-live";
import { env } from "@/lib/env";

// Vercel cron lo invoca cada 3 min (ver vercel.json).
// Bearer auth con CRON_SECRET para que solo Vercel lo pueda invocar.
// Si CRON_SECRET está vacío, el cron sigue funcionando pero queda abierto a
// llamadas manuales (útil en dev para forzar sync con curl).

export async function GET(req: Request) {
  if (env.CRON_SECRET) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${env.CRON_SECRET}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await syncLive();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/sync-live] error:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
