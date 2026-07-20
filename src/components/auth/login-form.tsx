"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, QrCode, ScanLine, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserRole } from "@/lib/snct-types";
import { cn } from "@/lib/utils";

const roles = [
  { value: "visitor", label: "Visitante", icon: QrCode, tone: "cyan" },
  { value: "staff", label: "Staff", icon: ScanLine, tone: "purple" },
  {
    value: "admin",
    label: "Administrador",
    icon: ShieldCheck,
    tone: "magenta",
  },
] as const;

function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("visitor");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        role,
        email: form.get("email"),
        password: form.get("password"),
      }),
    });
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(result.error ?? "Não foi possível entrar.");
      setLoading(false);
      return;
    }
    router.push("/perfil");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <fieldset>
        <legend className="mb-3 text-sm font-semibold text-ice-white">
          Tipo de acesso
        </legend>
        <div className="grid gap-2 sm:grid-cols-3">
          {roles.map(({ value, label, icon: Icon, tone }) => (
            <button
              key={value}
              type="button"
              aria-pressed={role === value}
              onClick={() => setRole(value)}
              className={cn(
                "flex min-h-20 flex-col items-center justify-center gap-2 rounded-xl border bg-white/[0.025] px-3 py-3 text-xs font-semibold text-blue-gray transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-electric",
                role === value &&
                  tone === "cyan" &&
                  "border-cyan-electric/70 bg-cyan-electric/10 text-cyan-electric shadow-[0_0_24px_rgb(0_229_255/10%)]",
                role === value &&
                  tone === "purple" &&
                  "border-purple-vibrant/70 bg-purple-vibrant/15 text-[#BDA5FF]",
                role === value &&
                  tone === "magenta" &&
                  "border-magenta-neon/60 bg-magenta-neon/10 text-[#FF9AE8]",
                role !== value &&
                  "border-white/10 hover:border-white/25 hover:text-ice-white",
              )}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </button>
          ))}
        </div>
      </fieldset>

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
        <Label htmlFor="password">Senha</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

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
        Entrar como {roles.find((item) => item.value === role)?.label}
      </Button>

      {role === "visitor" ? (
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
