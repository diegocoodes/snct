"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { secureFetch } from "@/lib/secure-fetch";

function safeNextPath(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/perfil";
  }
  return value;
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);

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
      user?: { role?: string };
    };
    if (!response.ok) {
      setError(result.error ?? result.message ?? "Não foi possível entrar.");
      setLoading(false);
      return;
    }

    const next = safeNextPath(searchParams.get("next"));
    const role = result.user?.role;
    if (
      next.startsWith("/staff/") &&
      role !== "staff" &&
      role !== "admin"
    ) {
      router.push("/perfil");
    } else {
      router.push(next);
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
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
        <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="glow" className="w-full" disabled={loading}>
        {loading ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
        Entrar
      </Button>
      <p className="text-center text-sm text-blue-gray">
        Ainda não tem conta?{" "}
        <Link href="/auth/inscricao" className="text-cyan-electric underline">
          Inscreva-se
        </Link>
      </p>
    </form>
  );
}

export { LoginForm };
