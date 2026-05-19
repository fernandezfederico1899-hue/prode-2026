"use client";

import { useTransition } from "react";
import { Check, Loader2, X } from "lucide-react";
import {
  approveUserAction,
  rejectUserAction,
} from "@/server/actions/admin-users";

export function UserActionButtons({ userId }: { userId: string }) {
  const [isPending, startTransition] = useTransition();

  const onApprove = () =>
    startTransition(async () => {
      await approveUserAction({ userId });
    });

  const onReject = () =>
    startTransition(async () => {
      if (!confirm("¿Seguro que querés rechazar a este usuario?")) return;
      await rejectUserAction({ userId });
    });

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={onApprove}
        disabled={isPending}
        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-[color:var(--correct-sign)] text-white font-bold uppercase tracking-wide text-sm hover:opacity-90 transition-opacity disabled:opacity-70 disabled:cursor-wait"
      >
        {isPending ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Check className="w-4 h-4" />
        )}
        Aprobar
      </button>
      <button
        type="button"
        onClick={onReject}
        disabled={isPending}
        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md border-2 border-destructive text-destructive font-bold uppercase tracking-wide text-sm hover:bg-destructive/10 transition-colors disabled:opacity-70 disabled:cursor-wait"
      >
        <X className="w-4 h-4" />
        Rechazar
      </button>
    </div>
  );
}
