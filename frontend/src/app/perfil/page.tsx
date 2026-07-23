import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { School } from "lucide-react";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { MfaEnrollment } from "@/components/auth/mfa-enrollment";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StaffCheckinPanel } from "@/components/check-in/staff-checkin-panel";
import { VisitorPass } from "@/components/dashboard/visitor-pass";
import { Button } from "@/components/ui/button";
import { getSession, toPublicUser } from "@/lib/auth";
import { readAuditEvents } from "@/lib/audit";
import { readSnctStore } from "@/lib/snct-store";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const store = await readSnctStore({ includeUsers: true });

  if (
    (session.role === "admin" || session.role === "staff") &&
    !session.mfaEnabled
  ) {
    return (
      <DashboardShell session={session}>
        <MfaEnrollment />
      </DashboardShell>
    );
  }

  if (session.role === "admin") {
    const auditLogs = await readAuditEvents(100);
    return (
      <DashboardShell session={session}>
        <div className="mb-6 flex flex-wrap gap-3">
          <Button variant="glow" render={<Link href="/admin/usuarios" />}>
            Gerenciar usuários
          </Button>
          <Button variant="outline" render={<Link href="/staff/checkin" />}>
            Abrir check-in
          </Button>
        </div>
        <AdminDashboard
          users={store.users.map(toPublicUser)}
          events={store.events}
          notices={store.notices}
          partners={store.partners}
          settings={store.settings}
          auditLogs={auditLogs}
        />
      </DashboardShell>
    );
  }

  if (session.role === "staff") {
    return (
      <DashboardShell session={session}>
        <Suspense fallback={<p className="text-blue-gray">Carregando check-in…</p>}>
          <StaffCheckinPanel />
        </Suspense>
      </DashboardShell>
    );
  }

  const visitor = store.users.find((user) => user.id === session.userId);
  if (!visitor) redirect("/login");

  if (session.role === "professor") {
    return (
      <DashboardShell session={session} activeNav="credencial">
        <div className="mb-6">
          <Button
            variant="glow"
            render={<Link href="/perfil/escola" />}
          >
            <School aria-hidden />
            Cadastrar escola, projetos e alunos
          </Button>
        </div>
        <VisitorPass visitor={toPublicUser(visitor)} showSecurity={false} />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell session={session}>
      <VisitorPass
        visitor={toPublicUser(visitor)}
        showSecurity={visitor.role !== "visitante"}
      />
    </DashboardShell>
  );
}
