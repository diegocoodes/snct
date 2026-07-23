import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProfessorPanel } from "@/components/dashboard/professor-panel";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProfessorEscolaPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role !== "professor") redirect("/perfil");

  return (
    <DashboardShell session={session} activeNav="escola">
      <ProfessorPanel />
    </DashboardShell>
  );
}
