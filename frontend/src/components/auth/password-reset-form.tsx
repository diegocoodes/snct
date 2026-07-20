"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { KeyRound, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { isStrongPassword } from "@/lib/password-policy";

function PasswordResetForm({ token }: { token?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) {
      setError("O link é inválido ou expirou.");
      return;
    }
    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    if (!isStrongPassword(password)) {
      setError(
        "Use pelo menos 12 caracteres, com maiúscula, minúscula, número e símbolo.",
      );
      return;
    }
    if (password !== form.get("confirmation")) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    setError("");
    const result = await authClient.resetPassword({
      newPassword: password,
      token,
    });
    if (result.error) {
      setError("O link expirou ou a senha não atende aos requisitos.");
      setLoading(false);
      return;
    }
    router.push("/login?senha=alterada");
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="new-password">Nova senha</Label>
        <Input
          id="new-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
        <p className="text-xs leading-5 text-blue-gray">
          Use 12+ caracteres com maiúscula, minúscula, número e símbolo.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password-confirmation">Confirmar nova senha</Label>
        <Input
          id="new-password-confirmation"
          name="confirmation"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={loading || !token}
      >
        {loading ? (
          <LoaderCircle className="animate-spin" aria-hidden />
        ) : (
          <KeyRound aria-hidden />
        )}
        Atualizar senha
      </Button>
      {!token ? (
        <p className="text-center text-sm text-blue-gray">
          <Link
            href="/recuperar-senha"
            className="font-semibold text-cyan-electric hover:underline"
          >
            Solicitar outro link
          </Link>
        </p>
      ) : null}
    </form>
  );
}

export { PasswordResetForm };
