import { AuthFrame } from "@/components/auth/auth-frame";
import { PasswordRecoveryForm } from "@/components/auth/password-recovery-form";

export default function PasswordRecoveryPage() {
  return (
    <AuthFrame
      eyebrow="Recuperação segura"
      title="Recupere seu acesso"
      description="Enviaremos um link de uso único para o e-mail cadastrado."
    >
      <PasswordRecoveryForm />
    </AuthFrame>
  );
}
