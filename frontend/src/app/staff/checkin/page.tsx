import { Suspense } from "react";
import { redirect } from "next/navigation";

import { StaffCheckinPanel } from "@/components/check-in/staff-checkin-panel";
import { MfaEnrollment } from "@/components/auth/mfa-enrollment";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { getSession, requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ qr?: string; busca?: string }>;
}) {
  const params = await searchParams;
  const returnQuery = new URLSearchParams();
  if (params.qr) returnQuery.set("qr", params.qr);
  if (params.busca) returnQuery.set("busca", params.busca);
  const returnPath = returnQuery.toString()
    ? `/staff/checkin?${returnQuery.toString()}`
    : "/staff/checkin";

  const session = await getSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(returnPath)}`);
  }
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
  const authorized = await requireRole("staff", "admin");
  if (!authorized) redirect("/perfil");
  return (
    <DashboardShell session={authorized}>
      <Suspense fallback={<p className="text-blue-gray">Carregando check-in…</p>}>
        <StaffCheckinPanel />
      </Suspense>
    </DashboardShell>
  );
}
