import { Check, X } from "lucide-react";
import { getAllPayments } from "@/server/queries/admin";
import { getTournamentConfig } from "@/server/queries/tournament-config";
import { PaymentToggle } from "@/components/admin/payment-toggle";

// Admin page: always read the DB live so users added out-of-band (e.g. via
// scripts/add-user.mjs) show up without waiting for a revalidatePath.
export const dynamic = "force-dynamic";

export default async function AdminPaymentsPage() {
  const [rows, config] = await Promise.all([
    getAllPayments(),
    getTournamentConfig(),
  ]);
  const pozoArs = config?.pozoAmountArs ?? 0;
  const paidCount = rows.filter((r) => r.paid).length;
  const unpaidCount = rows.length - paidCount;
  const pozoTotal = paidCount * pozoArs;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">PAGOS</h1>
        <p className="text-muted-foreground mt-1">
          Tracking de quién pagó el pozo. Las transferencias son por fuera; acá
          solo marcás.
        </p>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <Stat label="Pagaron" value={paidCount} accent="success" />
        <Stat
          label="Adeudan"
          value={unpaidCount}
          accent={unpaidCount > 0 ? "danger" : "neutral"}
        />
        <Stat
          label="Pozo total"
          value={`$${pozoTotal.toLocaleString("es-AR")}`}
          accent="primary"
        />
      </div>

      {rows.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          Todavía no hay jugadores aprobados.
        </div>
      ) : (
        <section className="rounded-lg border-2 border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              <tr>
                <th className="text-left px-4 py-2.5">Jugador</th>
                <th className="text-right px-4 py-2.5 w-24">Monto</th>
                <th className="text-center px-4 py-2.5 w-24">Estado</th>
                <th className="text-center px-4 py-2.5 w-32">Acción</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr
                  key={r.userId}
                  className={`border-t border-border ${
                    i % 2 === 1 ? "bg-muted/20" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <div className="font-bold uppercase tracking-wide">
                      {r.userName}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {r.userEmail}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">
                    ${pozoArs.toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {r.paid ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[color:var(--correct-sign)]/15 text-[color:var(--correct-sign)] text-[10px] font-bold uppercase tracking-wider">
                        <Check className="w-3 h-3" />
                        Pagó
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-destructive/15 text-destructive text-[10px] font-bold uppercase tracking-wider">
                        <X className="w-3 h-3" />
                        Debe
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <PaymentToggle userId={r.userId} paid={r.paid} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: "primary" | "success" | "danger" | "neutral";
}) {
  const colors = {
    primary: "text-primary",
    success: "text-[color:var(--correct-sign)]",
    danger: "text-destructive",
    neutral: "text-muted-foreground",
  };
  return (
    <div className="rounded-md border-2 border-border bg-card p-3">
      <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
        {label}
      </div>
      <div
        className={`font-display text-3xl mt-1 tabular-nums leading-none ${colors[accent]}`}
      >
        {value}
      </div>
    </div>
  );
}
