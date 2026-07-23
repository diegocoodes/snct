import { redirect } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSession, requireRole } from "@/lib/auth";
import { listParticipantesCheckin } from "@/lib/checkins";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function Page() {
  const session = await getSession();
  if (!session) redirect("/login");
  const authorized = await requireRole("staff", "admin");
  if (!authorized) redirect("/perfil");

  const participantes = await listParticipantesCheckin(100);

  return (
    <DashboardShell session={authorized}>
      <div className="space-y-6">
        <div>
          <p className="font-display text-sm tracking-[.2em] text-cyan-electric uppercase">
            Check-in
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ice-white">
            Histórico do dia
          </h1>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Participantes com status de hoje</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {participantes.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between rounded-xl border border-white/10 px-4 py-3 text-sm"
              >
                <div>
                  <p className="font-medium text-ice-white">{item.nomeCompleto}</p>
                  <p className="text-blue-gray">
                    {item.roleNome} · {item.historicoCheckins.length} check-in(s)
                  </p>
                </div>
                <p className={item.checkinHoje ? "text-emerald-400" : "text-blue-gray"}>
                  {item.checkinHoje ? "Presente hoje" : "Ausente hoje"}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardShell>
  );
}
