import { redirect } from "next/navigation";

import { UsuariosAdminPanel } from "@/components/admin/usuarios-admin-panel";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole, toPublicUser } from "@/lib/auth";
import { readSnctStore } from "@/lib/snct-store";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await requireRole("admin");
  if (!session) redirect("/login");
  const store = await readSnctStore({ includeUsers: true });
  return (
    <DashboardShell session={session}>
      <UsuariosAdminPanel initialUsers={store.users.map(toPublicUser)} />
    </DashboardShell>
  );
}
