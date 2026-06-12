import { getAuditLogEntries } from "@/server/queries/admin";

// Render dinámico: el log crece fuera de las server actions que revalidan.
export const dynamic = "force-dynamic";

const FORMAT = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

const ACTION_LABELS: Record<string, string> = {
  approve_user: "Usuario aprobado",
  reject_user: "Usuario rechazado",
  correct_score: "Resultado corregido",
  transition_status: "Estado de partido cambiado",
  mark_payment: "Pago marcado",
  unmark_payment: "Pago revertido",
  change_pozo: "Pozo modificado",
  resolve_bonus: "Bonus resuelto",
};

export default async function AdminAuditPage() {
  const entries = await getAuditLogEntries(100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">AUDIT LOG</h1>
        <p className="text-muted-foreground mt-1">
          Historial de acciones de admin. Read-only. Sirve para defender
          cualquier resultado si algún jugador cuestiona.
        </p>
      </header>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground rounded-lg border-2 border-dashed border-border">
          Todavía no hay acciones de admin registradas.
        </div>
      ) : (
        <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              <tr>
                <th className="text-left px-4 py-2.5 w-32">Fecha</th>
                <th className="text-left px-4 py-2.5 w-44">Acción</th>
                <th className="text-left px-4 py-2.5">Target</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e, i) => (
                <tr
                  key={e.id}
                  className={`border-t border-border ${
                    i % 2 === 1 ? "bg-muted/20" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                    {FORMAT.format(e.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold uppercase tracking-wider">
                    {ACTION_LABELS[e.action] ?? e.action}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span className="text-xs text-muted-foreground">
                      {e.targetType}
                    </span>{" "}
                    <span className="font-mono text-xs">{e.targetId}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
