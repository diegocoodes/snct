"use client";

export function MfaEnrollment() {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h2 className="font-display text-xl font-semibold text-ice-white">
        Autenticação
      </h2>
      <p className="mt-3 text-sm leading-6 text-blue-gray">
        O MFA TOTP foi desativado nesta versão simplificada. Use uma senha forte
        e não compartilhe a conta administrativa.
      </p>
    </div>
  );
}
