"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, Wand2 } from "lucide-react";
import { resolveKnockoutsAction } from "@/server/actions/admin-bracket";

export function BracketResolver({ groupsFinished }: { groupsFinished: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<
    | { ok: true; assigned: number; pendingManual: number }
    | { ok: false; error: string }
    | null
  >(null);

  const handleClick = () => {
    setResult(null);
    startTransition(async () => {
      const res = await resolveKnockoutsAction();
      if (res.ok) {
        setResult({ ok: true, ...res.data });
        router.refresh();
      } else {
        setResult({ ok: false, error: res.error });
      }
    });
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending || !groupsFinished}
        className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-md font-display tracking-wider hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            RESOLVIENDO...
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            AUTO-RESOLVER 16AVOS
          </>
        )}
      </button>

      {!groupsFinished && (
        <p className="text-xs text-muted-foreground">
          Disponible cuando todos los partidos de la fase de grupos estén
          finalizados.
        </p>
      )}

      {result && result.ok && (
        <div className="rounded-md border-2 border-green-500/30 bg-green-500/5 p-3 text-sm flex items-start gap-2">
          <Check className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" />
          <div>
            <strong>{result.assigned}</strong> slots asignados automáticamente.{" "}
            {result.pendingManual > 0 ? (
              <>
                Quedan <strong>{result.pendingManual}</strong> slots de
                tercero pendientes — asignalos a mano en los matches abajo.
              </>
            ) : (
              "Todos los matches de 16avos están resueltos."
            )}
          </div>
        </div>
      )}

      {result && !result.ok && (
        <div className="rounded-md border-2 border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {errorMsg(result.error)}
        </div>
      )}
    </div>
  );
}

function errorMsg(code: string): string {
  if (code.startsWith("group_not_finished:")) {
    const letter = code.split(":")[1];
    return `El grupo ${letter} todavía tiene partidos pendientes.`;
  }
  if (code === "unauthorized") return "No tenés permisos de admin.";
  return `Error: ${code}`;
}
