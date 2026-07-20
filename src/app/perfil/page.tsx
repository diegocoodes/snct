import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { MfaEnrollment } from "@/components/auth/mfa-enrollment";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StaffScanner } from "@/components/dashboard/staff-scanner";
import { VisitorPass } from "@/components/dashboard/visitor-pass";
import { getSession, toPublicUser } from "@/lib/auth";
import { readAuditEvents } from "@/lib/audit";
import { readSnctStore } from "@/lib/snct-store";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const store = await readSnctStore();

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
        <StaffScanner />
      </DashboardShell>
    );
  }

  const visitor = store.users.find((user) => user.id === session.userId);
  if (!visitor) redirect("/login");

  return (
    <DashboardShell session={session}>
      <VisitorPass visitor={toPublicUser(visitor)} />
    </DashboardShell>
  );
}
