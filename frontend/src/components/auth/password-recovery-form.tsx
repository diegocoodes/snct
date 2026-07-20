"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, LoaderCircle, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function PasswordRecoveryForm() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await authClient.requestPasswordReset({
      email: String(form.get("email") ?? ""),
      redirectTo: "/redefinir-senha",
    });
    if (result.error) {
      setError("Não foi possível processar a solicitação.");
      setLoading(false);
      return;
    }
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="text-center">
        <CheckCircle2
          className="mx-auto size-12 text-emerald-400"
          aria-hidden
        />
        <h2 className="mt-4 font-display text-xl font-semibold text-ice-white">
          Verifique seu e-mail
        </h2>
        <p className="mt-3 text-sm leading-6 text-blue-gray">
          Se existir uma conta para o endereço informado, ela receberá as
          instruções de redefinição.
        </p>
        <Button
          className="mt-6"
          variant="outline"
          render={<Link href="/login" />}
        >
          Voltar ao login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="recovery-email">E-mail</Label>
        <Input
          id="recovery-email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" size="lg" disabled={loading}>
        {loading ? (
          <LoaderCircle className="animate-spin" aria-hidden />
        ) : (
          <Mail aria-hidden />
        )}
        Enviar link seguro
      </Button>
      <p className="text-center text-sm text-blue-gray">
        <Link
          href="/login"
          className="font-semibold text-cyan-electric hover:underline"
        >
          Voltar ao login
        </Link>
      </p>
    </form>
  );
}

export { PasswordRecoveryForm };
