"use client";

import { useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { markPaymentAction } from "@/server/actions/admin-payments";

export function PaymentToggle({
  userId,
  paid,
}: {
  userId: string;
  paid: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const toggle = () =>
    startTransition(async () => {
      await markPaymentAction({ userId, paid: !paid });
    });

  if (paid) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-destructive disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : "Revertir"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      className="inline-flex items-center gap-1 px-3 py-1 rounded-md bg-[color:var(--correct-sign)] text-white text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-70 disabled:cursor-wait"
    >
      {isPending ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : (
        <Check className="w-3 h-3" />
      )}
      Marcar
    </button>
  );
}
