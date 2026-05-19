import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth";

export function SignOutButton() {
  return (
    <form
      action={async () => {
        "use server";
        await signOut({ redirectTo: "/login" });
      }}
    >
      <button
        type="submit"
        className="w-full block text-left rounded-xl border-2 border-border bg-card p-4 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-3 text-destructive">
          <LogOut className="w-5 h-5" />
          <span className="font-bold uppercase tracking-wide">
            Cerrar sesión
          </span>
        </div>
      </button>
    </form>
  );
}
