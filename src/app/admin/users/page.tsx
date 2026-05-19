import { Check, Clock, X } from "lucide-react";
import { pendingUsers, users } from "@/lib/mock-data";

const FORMAT = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "America/Argentina/Buenos_Aires",
});

export default function AdminUsersPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-8">
      <header>
        <h1 className="font-display text-4xl md:text-5xl">USUARIOS</h1>
        <p className="text-muted-foreground mt-1">
          Aprobá o rechazá las nuevas solicitudes. Solo los aprobados pueden
          acceder a la app.
        </p>
      </header>

      <section>
        <h2 className="font-display text-2xl mb-4">
          PENDIENTES{" "}
          <span className="text-accent tabular-nums">({pendingUsers.length})</span>
        </h2>
        {pendingUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No hay solicitudes pendientes 🎉
          </div>
        ) : (
          <div className="space-y-2">
            {pendingUsers.map((u) => (
              <article
                key={u.id}
                className="rounded-lg border-2 border-accent/40 bg-accent/5 p-4 flex flex-col md:flex-row md:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-display text-xl uppercase">{u.name}</div>
                  <div className="text-sm text-muted-foreground truncate">
                    {u.email}
                  </div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1 inline-flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Solicitado el {FORMAT.format(u.requestedAt)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-[color:var(--correct-sign)] text-white font-bold uppercase tracking-wide text-sm hover:opacity-90 transition-opacity"
                  >
                    <Check className="w-4 h-4" />
                    Aprobar
                  </button>
                  <button
                    type="button"
                    className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md border-2 border-destructive text-destructive font-bold uppercase tracking-wide text-sm hover:bg-destructive/10 transition-colors"
                  >
                    <X className="w-4 h-4" />
                    Rechazar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="font-display text-2xl mb-4">
          APROBADOS{" "}
          <span className="text-muted-foreground tabular-nums">({users.length})</span>
        </h2>
        <div className="rounded-lg border-2 border-border bg-card overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted/40 text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
              <tr>
                <th className="text-left px-4 py-2.5">Nombre</th>
                <th className="text-left px-4 py-2.5 hidden md:table-cell">Email</th>
                <th className="text-center px-4 py-2.5 w-24">Estado</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr
                  key={u.id}
                  className={`border-t border-border ${i % 2 === 1 ? "bg-muted/20" : ""}`}
                >
                  <td className="px-4 py-3 font-bold uppercase tracking-wide text-sm">
                    {u.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground hidden md:table-cell">
                    {u.id.replace("u-", "")}@gmail.com
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[color:var(--correct-sign)]/15 text-[color:var(--correct-sign)] text-[10px] font-bold uppercase tracking-wider">
                      <Check className="w-3 h-3" />
                      Aprobado
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
