import { AuthFrame } from "@/components/auth/auth-frame";
import { PasswordResetForm } from "@/components/auth/password-reset-form";

export default async function PasswordResetPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <AuthFrame
      eyebrow="Nova senha"
      title="Proteja sua conta"
      description="Defina uma senha nova e exclusiva para o portal."
    >
      <PasswordResetForm token={token} />
    </AuthFrame>
  );
}
