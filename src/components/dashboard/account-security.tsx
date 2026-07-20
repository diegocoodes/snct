"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  KeyRound,
  LoaderCircle,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { secureFetch } from "@/lib/secure-fetch";

function AccountSecurity() {
  const router = useRouter();
  const [showDelete, setShowDelete] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState<"rotate" | "delete" | "export" | null>(
    null,
  );

  async function exportData() {
    setLoading("export");
    const response = await secureFetch("/api/account", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "exportData" }),
    });
    if (!response.ok) {
      toast.error("Não foi possível exportar seus dados.");
      setLoading(null);
      return;
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meus-dados-snct.json";
    link.click();
    URL.revokeObjectURL(url);
    setLoading(null);
  }

  async function rotateQr() {
    setLoading("rotate");
    const response = await secureFetch("/api/account", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "rotateQr" }),
    });
    if (!response.ok) toast.error("Não foi possível renovar a credencial.");
    else {
      toast.success("QR Code anterior revogado e nova credencial criada.");
      router.refresh();
    }
    setLoading(null);
  }

  async function deleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading("delete");
    const response = await secureFetch("/api/account", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const result = (await response.json()) as {
      error?: string;
      message?: string;
    };
    if (!response.ok) {
      toast.error(
        result.error ??
          result.message ??
          "Não foi possível solicitar a exclusão.",
      );
      setLoading(null);
      return;
    }
    toast.success(
      "Solicitação registrada. Verifique seu e-mail para confirmar.",
    );
    setPassword("");
    setShowDelete(false);
    setLoading(null);
  }

  return (
    <Card className="mt-5 border-white/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <KeyRound className="size-5 text-cyan-electric" aria-hidden />
          Segurança e privacidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm leading-6 text-blue-gray">
          Exporte uma cópia dos seus dados, revogue o QR Code atual ou solicite
          a exclusão da conta.
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button
            type="button"
            variant="outline"
            onClick={exportData}
            disabled={loading !== null}
          >
            {loading === "export" ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : (
              <Download aria-hidden />
            )}
            Exportar dados
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={rotateQr}
            disabled={loading !== null}
          >
            {loading === "rotate" ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : (
              <RotateCcw aria-hidden />
            )}
            Renovar QR
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setShowDelete((current) => !current)}
            disabled={loading !== null}
          >
            <Trash2 aria-hidden /> Excluir conta
          </Button>
        </div>
        {showDelete ? (
          <form
            onSubmit={deleteAccount}
            className="rounded-xl border border-destructive/25 bg-destructive/5 p-4"
          >
            <p className="text-sm font-semibold text-ice-white">
              Esta ação é permanente.
            </p>
            <p className="mt-1 text-xs leading-5 text-blue-gray">
              Confirme sua senha. Em produção, enviaremos um link de confirmação
              para seu e-mail.
            </p>
            <div className="mt-4 space-y-2">
              <Label htmlFor="delete-password">Senha atual</Label>
              <Input
                id="delete-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              variant="destructive"
              className="mt-4"
              disabled={loading !== null}
            >
              {loading === "delete" ? (
                <LoaderCircle className="animate-spin" aria-hidden />
              ) : (
                <Trash2 aria-hidden />
              )}
              Confirmar solicitação
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}

export { AccountSecurity };
