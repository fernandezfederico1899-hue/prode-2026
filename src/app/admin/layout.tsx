import { Shield } from "lucide-react";
import { AdminSubNav } from "@/components/admin/admin-sub-nav";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Admin mode banner */}
      <div className="bg-secondary text-secondary-foreground">
        <div className="max-w-6xl mx-auto px-4 py-2 flex items-center gap-2 text-xs uppercase tracking-wider font-bold">
          <Shield className="w-3.5 h-3.5" />
          Modo admin · fernandezfederico1899@gmail.com
        </div>
      </div>

      <AdminSubNav />

      <div>{children}</div>
    </div>
  );
}
