import { redirect } from "next/navigation";

import { AuthFrame } from "@/components/auth/auth-frame";
import { RegisterForm } from "@/components/auth/register-form";
import { getSession } from "@/lib/auth";

export default async function RegisterPage() {
  if (await getSession()) redirect("/perfil");

  return (
    <AuthFrame
      eyebrow="Credencial de visitante"
      title="Crie seu perfil"
      description="Cada cadastro recebe um identificador exclusivo, uma hash individual e um novo QR Code para o evento."
    >
      <RegisterForm />
    </AuthFrame>
  );
}
