import { redirect } from "next/navigation";

import { AuthFrame } from "@/components/auth/auth-frame";
import { LoginForm } from "@/components/auth/login-form";
import { getSession } from "@/lib/auth";

export default async function LoginPage() {
  if (await getSession()) redirect("/perfil");

  return (
    <AuthFrame
      eyebrow="Acesso seguro"
      title="Entre na sua área"
      description="Selecione o perfil correto para acessar sua credencial, fazer check-ins ou administrar o evento."
    >
      <LoginForm />
    </AuthFrame>
  );
}
