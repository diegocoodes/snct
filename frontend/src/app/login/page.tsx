import { Suspense } from "react";
import { redirect } from "next/navigation";

import { AuthFrame } from "@/components/auth/auth-frame";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();
  if (session) {
    const next = params.next;
    if (
      next?.startsWith("/") &&
      !next.startsWith("//") &&
      (session.role === "staff" || session.role === "admin")
    ) {
      redirect(next);
    }
    redirect("/perfil");
  }

  return (
    <AuthFrame
      eyebrow="Acesso seguro"
      title="Entre na sua área"
      description="Selecione o perfil correto para acessar sua credencial, fazer check-ins ou administrar o evento."
    >
      <Suspense fallback={<p className="text-blue-gray">Carregando…</p>}>
        <LoginForm />
      </Suspense>
    </AuthFrame>
  );
}
