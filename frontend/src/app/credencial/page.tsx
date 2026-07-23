import Link from "next/link";

import { CredencialVisitanteClient } from "@/components/credencial/credencial-visitante-client";
import { EventFooter } from "@/components/event/event-footer";
import { EventHeader } from "@/components/event/event-header";

export const dynamic = "force-dynamic";

export default async function CredencialPage({
  searchParams,
}: {
  searchParams: Promise<{ cpf?: string }>;
}) {
  const params = await searchParams;

  return (
    <div className="min-h-screen bg-purple-deep text-ice-white">
      <EventHeader />
      <main className="pt-24">
        <CredencialVisitanteClient initialCpf={params.cpf ?? ""} />
      </main>
      <EventFooter />
      <div className="sr-only">
        <Link href="/">Início</Link>
      </div>
    </div>
  );
}
