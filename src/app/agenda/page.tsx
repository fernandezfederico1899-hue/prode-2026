import { redirect } from "next/navigation";

// /agenda quedó fusionada en /matches (con tab "Por fecha" como default).
export default function AgendaPage() {
  redirect("/matches");
}
