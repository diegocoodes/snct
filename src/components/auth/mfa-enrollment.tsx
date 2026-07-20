"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Copy, LoaderCircle, ShieldCheck } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

function MfaEnrollment() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [totpURI, setTotpURI] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!totpURI) return;
    QRCode.toDataURL(totpURI, { width: 420, margin: 2 }).then(setQrCode);
  }, [totpURI]);

  async function beginEnrollment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const result = await authClient.twoFactor.enable({ password });
    if (result.error || !result.data) {
      setError("Não foi possível iniciar a verificação. Confirme sua senha.");
      setLoading(false);
      return;
    }
    setTotpURI(result.data.totpURI);
    setBackupCodes(result.data.backupCodes);
    setLoading(false);
  }

  async function verifyEnrollment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const result = await authClient.twoFactor.verifyTotp({
      code: String(form.get("code") ?? ""),
      trustDevice: false,
    });
    if (result.error) {
      setError("Código inválido. Aguarde um novo código e tente novamente.");
      setLoading(false);
      return;
    }
    toast.success("Verificação em duas etapas ativada.");
    router.refresh();
  }

  async function copyBackupCodes() {
    await navigator.clipboard.writeText(backupCodes.join("\n"));
    toast.success("Códigos copiados. Guarde-os em local seguro.");
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-8">
        <p className="font-display text-sm tracking-[.2em] text-cyan-electric uppercase">
          Proteção obrigatória
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ice-white">
          Ative a verificação em duas etapas
        </h1>
        <p className="mt-4 leading-7 text-blue-gray">
          Contas de equipe e administração só acessam funções sensíveis depois
          de configurar um aplicativo autenticador.
        </p>
      </div>

      <Card className="border-cyan-electric/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <ShieldCheck className="size-6 text-cyan-electric" aria-hidden />
            {totpURI ? "Concluir configuração" : "Confirmar identidade"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!totpURI ? (
            <form onSubmit={beginEnrollment} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mfa-password">Senha atual</Label>
                <Input
                  id="mfa-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <LoaderCircle className="animate-spin" aria-hidden />
                ) : null}
                Configurar autenticador
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-[220px_1fr] sm:items-center">
                <div className="rounded-2xl bg-white p-3">
                  {qrCode ? (
                    <Image
                      src={qrCode}
                      alt="QR Code para configurar o autenticador"
                      width={420}
                      height={420}
                      unoptimized
                    />
                  ) : null}
                </div>
                <div>
                  <p className="text-sm leading-6 text-blue-gray">
                    Leia o QR Code com Google Authenticator, Microsoft
                    Authenticator, 1Password ou outro aplicativo TOTP.
                  </p>
                  <p className="mt-4 text-sm font-semibold text-ice-white">
                    Códigos de recuperação
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 rounded-xl bg-black/25 p-3 font-mono text-xs text-cyan-electric">
                    {backupCodes.map((code) => (
                      <span key={code}>{code}</span>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    className="mt-2"
                    onClick={copyBackupCodes}
                  >
                    <Copy aria-hidden /> Copiar códigos
                  </Button>
                </div>
              </div>
              <form
                onSubmit={verifyEnrollment}
                className="flex flex-col gap-3 sm:flex-row sm:items-end"
              >
                <div className="flex-1 space-y-2">
                  <Label htmlFor="mfa-code">Código de 6 dígitos</Label>
                  <Input
                    id="mfa-code"
                    name="code"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    required
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <LoaderCircle className="animate-spin" aria-hidden />
                  ) : null}
                  Ativar proteção
                </Button>
              </form>
            </div>
          )}
          {error ? (
            <p role="alert" className="mt-4 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

export { MfaEnrollment };
