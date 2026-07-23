"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LoaderCircle, QrCode } from "lucide-react";

import { VisitorPass } from "@/components/dashboard/visitor-pass";
import { Button } from "@/components/ui/button";
import { InputMask } from "@/components/ui/input-mask";
import { Label } from "@/components/ui/label";
import { isValidCpf, onlyDigits } from "@/lib/cpf";
import { secureFetch } from "@/lib/secure-fetch";
import type { PublicUser } from "@/lib/snct-types";

function CredencialVisitanteClient({
  initialCpf = "",
}: {
  initialCpf?: string;
}) {
  const [cpf, setCpf] = useState(initialCpf);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [visitor, setVisitor] = useState<PublicUser | null>(null);
  const [autoTried, setAutoTried] = useState(false);

  async function lookup(cpfValue: string) {
    setLoading(true);
    setError("");
    setVisitor(null);

    if (!isValidCpf(cpfValue)) {
      setError("Informe um CPF válido.");
      setLoading(false);
      return;
    }

    const response = await secureFetch("/api/credencial/visitante", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cpf: onlyDigits(cpfValue) }),
    });
    const result = (await response.json()) as {
      error?: string;
      visitor?: PublicUser;
    };

    if (!response.ok || !result.visitor) {
      setError(result.error ?? "Não foi possível localizar a credencial.");
      setLoading(false);
      return;
    }

    setVisitor(result.visitor);
    setLoading(false);
  }

  useEffect(() => {
    if (!initialCpf || autoTried) return;
    setAutoTried(true);
    if (isValidCpf(initialCpf)) {
      void lookup(initialCpf);
    }
  }, [initialCpf, autoTried]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await lookup(cpf);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {!visitor ? (
        <div className="mx-auto max-w-md">
          <p className="font-display text-sm tracking-[.2em] text-cyan-electric uppercase">
            Credencial
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ice-white">
            Acessar minha credencial
          </h1>
          <p className="mt-4 text-blue-gray">
            Digite o CPF para ver o QR Code — vale para visitante, aluno,
            professor e avaliador.
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cpf-credencial">CPF</Label>
              <InputMask
                id="cpf-credencial"
                name="cpf"
                mask="cpf"
                value={cpf}
                onChange={(event) => setCpf(event.currentTarget.value)}
                required
              />
            </div>
            {error ? (
              <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </p>
            ) : null}
            <Button type="submit" variant="glow" className="w-full" disabled={loading}>
              {loading ? (
                <LoaderCircle className="animate-spin" aria-hidden />
              ) : (
                <QrCode aria-hidden />
              )}
              Ver QR Code
            </Button>
            <Button
              variant="outline"
              className="w-full"
              render={<Link href="/auth/inscricao" />}
            >
              Ainda não tenho inscrição
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setVisitor(null);
                setError("");
              }}
            >
              Consultar outro CPF
            </Button>
            <Button variant="ghost" render={<Link href="/" />}>
              Voltar ao início
            </Button>
          </div>
          <VisitorPass visitor={visitor} />
        </div>
      )}
    </div>
  );
}

export { CredencialVisitanteClient };
