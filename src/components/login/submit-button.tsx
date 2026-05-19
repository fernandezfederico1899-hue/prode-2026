"use client";

import { Loader2 } from "lucide-react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils";

export function SubmitButton({
  children,
  className,
  pendingLabel,
}: {
  children: React.ReactNode;
  className?: string;
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={cn(
        // Base
        "w-full inline-flex items-center justify-center gap-3 px-5 py-4",
        "rounded-md font-bold text-base select-none",
        // Relieve 3D: sombra densa abajo + borde
        "bg-white border-2 border-zinc-300 text-zinc-900",
        "shadow-[0_4px_0_0_rgb(0_0_0_/_0.18)]",
        // Hover: sombra más grande, leve elevación
        "hover:bg-zinc-50 hover:border-zinc-400",
        "hover:shadow-[0_6px_0_0_rgb(0_0_0_/_0.20)] hover:-translate-y-0.5",
        // Active (pressed): se hunde, sombra se reduce
        "active:translate-y-1 active:shadow-[0_1px_0_0_rgb(0_0_0_/_0.20)]",
        // Focus visible para accesibilidad
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        // Transición rápida (100ms) para que se sienta inmediato
        "transition-all duration-75 ease-out",
        // Loading state
        "disabled:cursor-wait disabled:opacity-90",
        className,
      )}
    >
      {pending ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin shrink-0" />
          {pendingLabel ?? "Cargando..."}
        </>
      ) : (
        children
      )}
    </button>
  );
}
