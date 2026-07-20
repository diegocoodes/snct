"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { secureFetch } from "@/lib/secure-fetch";

function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [age, setAge] = useState(18);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    if (form.get("password") !== form.get("passwordConfirmation")) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }
    const response = await secureFetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        age: form.get("age"),
        email: form.get("email"),
        password: form.get("password"),
        privacyConsent: form.get("privacyConsent") === "on",
        guardianConsent: form.get("guardianConsent") === "on",
      }),
    });
    const result = (await response.json()) as {
      error?: string;
      message?: string;
    };
    if (!response.ok) {
      setError(
        result.error ?? result.message ?? "Não foi possível criar o perfil.",
      );
      setLoading(false);
      return;
    }
    router.push(
      process.env.NODE_ENV === "production"
        ? "/login?verifique=email"
        : "/perfil",
    );
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="name">Nome completo</Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          minLength={2}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="age">Idade</Label>
        <Input
          id="age"
          name="age"
          type="number"
          min={5}
          max={120}
          inputMode="numeric"
          value={age}
          onChange={(event) => setAge(Number(event.target.value))}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Senha forte</Label>
        <Input
          id="password"
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
        <Label htmlFor="passwordConfirmation">Confirmar senha</Label>
        <Input
          id="passwordConfirmation"
          name="passwordConfirmation"
          type="password"
          autoComplete="new-password"
          minLength={12}
          maxLength={128}
          required
        />
      </div>

      <div className="space-y-4 rounded-2xl border border-cyan-electric/20 bg-cyan-electric/5 p-4 sm:col-span-2">
        <div className="flex items-start gap-3">
          <Checkbox id="privacyConsent" name="privacyConsent" required />
          <Label
            htmlFor="privacyConsent"
            className="text-sm leading-6 text-blue-gray"
          >
            Li e aceito o{" "}
            <Link
              href="/privacidade"
              target="_blank"
              className="text-cyan-electric underline"
            >
              Aviso de Privacidade
            </Link>{" "}
            e autorizo o tratamento dos dados para inscrição, credenciamento e
            operação do evento.
          </Label>
        </div>
        {age < 18 ? (
          <div className="flex items-start gap-3">
            <Checkbox id="guardianConsent" name="guardianConsent" required />
            <Label
              htmlFor="guardianConsent"
              className="text-sm leading-6 text-blue-gray"
            >
              Confirmo que este cadastro possui ciência e autorização do
              responsável legal.
            </Label>
          </div>
        ) : null}
        <div className="flex items-center gap-2 text-xs text-blue-gray">
          <ShieldCheck className="size-4 text-cyan-electric" aria-hidden />
          Seus dados não são publicados e podem ser exportados ou excluídos pelo
          perfil.
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive sm:col-span-2"
        >
          {error}
        </p>
      ) : null}

      <div className="sm:col-span-2">
        <Button type="submit" size="lg" className="w-full" disabled={loading}>
          {loading ? (
            <LoaderCircle
              className="animate-spin motion-reduce:animate-none"
              aria-hidden
            />
          ) : (
            <Sparkles aria-hidden />
          )}
          Criar credencial protegida
        </Button>
        <p className="mt-5 text-center text-sm text-blue-gray">
          Já possui cadastro?{" "}
          <Link
            href="/login"
            className="font-semibold text-cyan-electric hover:underline"
          >
            Entrar
          </Link>
        </p>
      </div>
    </form>
  );
}

export { RegisterForm };
