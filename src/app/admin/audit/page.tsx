import { auditLog } from "@/lib/mock-data";

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
  mark_payment: "Pago marcado",
  unmark_payment: "Pago revertido",
  change_pozo: "Pozo modificado",
  resolve_bonus: "Bonus resuelto",
};

export default function AdminAuditPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-6">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">AUDIT LOG</h1>
        <p className="text-muted-foreground mt-1">
          Historial de acciones de admin. Read-only. Sirve para defender
          cualquier resultado si algún jugador cuestiona.
        </p>
      </header>

      <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
            <tr>
              <th className="text-left px-4 py-2.5 w-32">Fecha</th>
              <th className="text-left px-4 py-2.5 w-40">Acción</th>
              <th className="text-left px-4 py-2.5">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {auditLog.map((e, i) => (
              <tr
                key={e.id}
                className={`border-t border-border ${i % 2 === 1 ? "bg-muted/20" : ""}`}
              >
                <td className="px-4 py-3 text-xs text-muted-foreground tabular-nums">
                  {FORMAT.format(e.createdAt)}
                </td>
                <td className="px-4 py-3 text-sm font-bold uppercase tracking-wider">
                  {ACTION_LABELS[e.action] ?? e.action}
                </td>
                <td className="px-4 py-3 text-sm">{e.target}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        En producción se guarda payload completo (before/after) en JSONB para
        auditoría detallada.
      </p>
    </div>
  );
}
