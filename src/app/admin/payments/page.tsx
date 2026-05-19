import { Check, Coins, X } from "lucide-react";
import { leaderboard, tournamentConfig } from "@/lib/mock-data";

export default function AdminPaymentsPage() {
  const paid = leaderboard.filter((r) => r.hasPaid);
  const unpaid = leaderboard.filter((r) => !r.hasPaid);
  const pozoTotal = paid.length * tournamentConfig.pozoAmountArs;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">PAGOS</h1>
        <p className="text-muted-foreground mt-1">
          Tracking de quién pagó el pozo. Las transferencias son por fuera; acá
          solo marcás.
        </p>
      </header>

      {/* Resumen */}
      <div className="grid grid-cols-3 gap-3">
        <Stat
          label="Pagaron"
          value={paid.length}
          accent="success"
        />
        <Stat
          label="Adeudan"
          value={unpaid.length}
          accent={unpaid.length > 0 ? "danger" : "neutral"}
        />
        <Stat
          label="Pozo total"
          value={`$${pozoTotal.toLocaleString("es-AR")}`}
          accent="primary"
        />
      </div>

      {/* Lista */}
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
            {leaderboard.map((r, i) => (
              <tr
                key={r.user.id}
                className={`border-t border-border ${i % 2 === 1 ? "bg-muted/20" : ""}`}
              >
                <td className="px-4 py-3 font-bold uppercase tracking-wide">
                  {r.user.name}
                </td>
                <td className="px-4 py-3 text-right text-sm tabular-nums text-muted-foreground">
                  ${tournamentConfig.pozoAmountArs.toLocaleString("es-AR")}
                </td>
                <td className="px-4 py-3 text-center">
                  {r.hasPaid ? (
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
                  {r.hasPaid ? (
                    <button
                      type="button"
                      className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive"
                    >
                      Revertir
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-[color:var(--correct-sign)] text-white text-xs font-bold uppercase tracking-wider hover:opacity-90"
                    >
                      <Check className="w-3 h-3" />
                      Marcar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
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
