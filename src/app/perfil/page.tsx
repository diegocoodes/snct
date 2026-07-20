import { redirect } from "next/navigation";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { StaffScanner } from "@/components/dashboard/staff-scanner";
import { VisitorPass } from "@/components/dashboard/visitor-pass";
import { getSession, toPublicUser } from "@/lib/auth";
import { readSnctStore } from "@/lib/snct-store";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const store = await readSnctStore();

  if (session.role === "admin") {
    return (
      <DashboardShell session={session}>
        <AdminDashboard
          users={store.users.map(toPublicUser)}
          events={store.events}
          notices={store.notices}
          partners={store.partners}
          settings={store.settings}
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
