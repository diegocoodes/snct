import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

import { LogoutButton } from "@/components/dashboard/logout-button";
import { Badge } from "@/components/ui/badge";
import type { SessionData } from "@/lib/snct-types";

const roleLabels = {
  visitor: "Visitante",
  staff: "Staff",
  admin: "Administrador",
} as const;

function DashboardShell({
  session,
  children,
}: {
  session: SessionData;
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-purple-deep">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 circuit-grid opacity-25"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-48 left-1/3 size-[36rem] rounded-full bg-purple-vibrant/20 blur-[150px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute right-0 bottom-0 size-[30rem] rounded-full bg-cyan-electric/8 blur-[140px]"
      />

      <header className="relative z-20 border-b border-white/10 bg-purple-deep/80 backdrop-blur-xl">
        <div className="mx-auto flex min-h-20 max-w-7xl items-center justify-between gap-4 px-5 py-3 sm:px-8">
          <Link
            href="/"
            className="flex items-center gap-3"
            aria-label="Voltar ao portal SNCT"
          >
            <Image
              src="/images/cienciasemfundo.png"
              alt="SNCT"
              width={560}
              height={405}
              className="h-12 w-auto object-contain"
              priority
            />
            <span className="hidden border-l border-white/15 pl-3 text-sm font-semibold text-ice-white sm:block">
              Área do evento
            </span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-ice-white">
                {session.name}
              </p>
              <p className="text-xs text-blue-gray">{session.email}</p>
            </div>
            <Badge
              variant="outline"
              className="border-cyan-electric/25 bg-cyan-electric/10 text-cyan-electric"
            >
              <LayoutDashboard data-icon="inline-start" aria-hidden />
              {roleLabels[session.role]}
            </Badge>
            <LogoutButton />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
        {children}
      </main>
    </div>
  );
}

export { DashboardShell };
