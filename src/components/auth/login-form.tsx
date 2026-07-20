"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { secureFetch } from "@/lib/secure-fetch";

function LoginForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [mfaPending, setMfaPending] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

    if (mfaPending) {
      const code = String(form.get("code") ?? "").trim();
      const result = useBackupCode
        ? await authClient.twoFactor.verifyBackupCode({ code })
        : await authClient.twoFactor.verifyTotp({ code, trustDevice: false });
      if (result.error) {
        setError("Código inválido ou expirado.");
        setLoading(false);
        return;
      }
      router.push("/perfil");
      router.refresh();
      return;
    }

    const response = await secureFetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const result = (await response.json()) as {
      error?: string;
      message?: string;
      twoFactorRedirect?: boolean;
    };
    if (!response.ok) {
      setError(result.error ?? result.message ?? "Não foi possível entrar.");
      setLoading(false);
      return;
    }
    if (result.twoFactorRedirect) {
      setMfaPending(true);
      setLoading(false);
      return;
    }
    router.push("/perfil");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {mfaPending ? (
        <>
          <div className="rounded-2xl border border-cyan-electric/25 bg-cyan-electric/5 p-4">
            <ShieldCheck className="size-6 text-cyan-electric" aria-hidden />
            <h2 className="mt-3 font-display text-lg font-semibold text-ice-white">
              Verificação em duas etapas
            </h2>
            <p className="mt-2 text-sm leading-6 text-blue-gray">
              Informe o código do aplicativo autenticador ou use um código de
              recuperação.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="code">
              {useBackupCode ? "Código de recuperação" : "Código de 6 dígitos"}
            </Label>
            <Input
              id="code"
              name="code"
              inputMode={useBackupCode ? "text" : "numeric"}
              autoComplete="one-time-code"
              pattern={useBackupCode ? undefined : "[0-9]{6}"}
              maxLength={useBackupCode ? 32 : 6}
              required
              autoFocus
            />
          </div>
          <button
            type="button"
            className="text-sm font-semibold text-cyan-electric hover:underline"
            onClick={() => setUseBackupCode((current) => !current)}
          >
            {useBackupCode
              ? "Usar aplicativo autenticador"
              : "Usar código de recuperação"}
          </button>
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-4">
            <div className="flex items-center gap-3">
              <KeyRound className="size-5 text-cyan-electric" aria-hidden />
              <p className="text-sm text-blue-gray">
                Seu perfil de acesso é identificado automaticamente.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="voce@exemplo.com"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="password">Senha</Label>
              <Link
                href="/recuperar-senha"
                className="text-xs font-semibold text-cyan-electric hover:underline"
              >
                Esqueci a senha
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
            />
          </div>
        </>
      )}

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={loading}>
        {loading ? (
          <LoaderCircle
            className="animate-spin motion-reduce:animate-none"
            aria-hidden
          />
        ) : null}
        {mfaPending ? "Validar código" : "Entrar com segurança"}
      </Button>

      {!mfaPending ? (
        <p className="text-center text-sm text-blue-gray">
          Ainda não tem credencial?{" "}
          <Link
            href="/cadastro"
            className="font-semibold text-cyan-electric hover:underline"
          >
            Criar perfil gratuito
          </Link>
        </p>
      ) : null}
    </form>
  );
}

export { LoginForm };
