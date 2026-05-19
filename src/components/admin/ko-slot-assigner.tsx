"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Team } from "@/db/schema";
import { assignKnockoutSlotAction } from "@/server/actions/admin-bracket";

export function KoSlotAssigner({
  matchId,
  side,
  currentTeamId,
  slotLabel,
  candidates,
}: {
  matchId: string;
  side: "home" | "away";
  currentTeamId: string | null;
  slotLabel: string | null;
  candidates: Team[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (value: string) => {
    const teamId = value === "__unassign__" ? null : value;
    startTransition(async () => {
      const res = await assignKnockoutSlotAction({ matchId, side, teamId });
      if (res.ok) {
        router.refresh();
      } else {
        alert(`Error: ${res.error}`);
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <Select
        value={currentTeamId ?? undefined}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger className="min-w-[180px]">
          <SelectValue placeholder={slotLabel ?? "Asignar..."} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__unassign__">
            <span className="italic text-muted-foreground">— Sin asignar —</span>
          </SelectItem>
          {candidates.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://flagcdn.com/${t.flagCode}.svg`}
                alt=""
                className="w-5 h-[15px] rounded-sm border border-border object-cover"
              />
              <span>{t.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">
                Grupo {t.groupLetter}
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
    </div>
  );
}
