import { redirect } from "next/navigation";

import { UsuariosAdminPanel } from "@/components/admin/usuarios-admin-panel";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { requireRole, toPublicUser } from "@/lib/auth";
import { readSnctStore } from "@/lib/snct-store";
import { listRoleChanges } from "@/lib/usuarios";

export const dynamic = "force-dynamic";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("admin");
  if (!session) redirect("/login");
  const { id } = await params;
  const [store, roleHistory] = await Promise.all([
    readSnctStore({ includeUsers: true }),
    listRoleChanges(id),
  ]);
  const selected = store.users.find((user) => user.id === id);
  if (!selected) redirect("/admin/usuarios");

  return (
    <DashboardShell session={session}>
      <UsuariosAdminPanel
        initialUsers={store.users.map(toPublicUser)}
        selectedUser={toPublicUser(selected)}
        roleHistory={roleHistory}
      />
    </DashboardShell>
  );
}
