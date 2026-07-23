import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { VisitorPass } from "@/components/dashboard/visitor-pass";
import { getSession, toPublicUser } from "@/lib/auth";
import { readSnctStore } from "@/lib/snct-store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  if (session.role === "admin") redirect("/perfil");

  const store = await readSnctStore({ includeUsers: true });
  const user = store.users.find((item) => item.id === session.userId);
  if (!user) redirect("/login");

  return (
    <DashboardShell session={session}>
      <VisitorPass
        visitor={toPublicUser(user)}
        showSecurity={user.role !== "visitante"}
      />
    </DashboardShell>
  );
}
