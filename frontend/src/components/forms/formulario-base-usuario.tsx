"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LoaderCircle, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputMask } from "@/components/ui/input-mask";
import { Label } from "@/components/ui/label";
import { isValidCpf, onlyDigits } from "@/lib/cpf";
import { secureFetch } from "@/lib/secure-fetch";
import type { RoleCodigo } from "@/lib/snct-types";

const checkboxClassName =
  "mt-1 size-4 shrink-0 cursor-pointer rounded border border-cyan-electric/40 bg-[#111329] accent-cyan-electric";

const roleToPath: Record<
  Extract<RoleCodigo, "AVALIADOR" | "PROFESSOR" | "VISITANTE">,
  string
> = {
  AVALIADOR: "avaliador",
  PROFESSOR: "professor",
  VISITANTE: "visitante",
};

type FormularioBaseUsuarioProps = {
  roleCodigo: Extract<
    RoleCodigo,
    "AVALIADOR" | "PROFESSOR" | "VISITANTE"
  >;
  titulo?: string;
};

function FormularioBaseUsuario({
  roleCodigo,
  titulo,
}: FormularioBaseUsuarioProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [birth, setBirth] = useState("");
  const [aceitouDireitoImagem, setAceitouDireitoImagem] = useState(false);
  const [privacyConsent, setPrivacyConsent] = useState(false);
  const [guardianConsent, setGuardianConsent] = useState(false);

  const age = useMemo(() => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birth)) return null;
    const [y, m, d] = birth.split("-").map(Number);
    const now = new Date();
    let value = now.getFullYear() - y;
    if (
      now.getMonth() + 1 < m ||
      (now.getMonth() + 1 === m && now.getDate() < d)
    ) {
      value -= 1;
    }
    return value;
  }, [birth]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const isVisitante = roleCodigo === "VISITANTE";

    const senha = String(form.get("senha") ?? "");
    const confirmar = String(form.get("confirmarSenha") ?? "");
    if (!isVisitante && senha !== confirmar) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }
    if (!isValidCpf(String(form.get("cpf") ?? ""))) {
      setError("Informe um CPF válido.");
      setLoading(false);
      return;
    }
    if (!aceitouDireitoImagem) {
      setError("Aceite o direito de uso de imagem para concluir a inscrição.");
      setLoading(false);
      return;
    }
    if (!privacyConsent) {
      setError("Aceite o aviso de privacidade para continuar.");
      setLoading(false);
      return;
    }
    if (age !== null && age < 18 && !guardianConsent) {
      setError("O consentimento do responsável é obrigatório para menores.");
      setLoading(false);
      return;
    }

    const payload = new FormData();
    payload.set("nomeCompleto", String(form.get("nomeCompleto") ?? "").trim());
    payload.set("email", String(form.get("email") ?? "").trim().toLowerCase());
    payload.set("telefone", onlyDigits(String(form.get("telefone") ?? "")));
    payload.set("cpf", onlyDigits(String(form.get("cpf") ?? "")));
    payload.set("dataNascimento", String(form.get("dataNascimento") ?? ""));
    payload.set("senha", isVisitante ? "VisitanteSemLogin!" : senha);
    payload.set("aceitouDireitoImagem", aceitouDireitoImagem ? "true" : "false");
    payload.set("privacyConsent", privacyConsent ? "true" : "false");
    if (guardianConsent) {
      payload.set("guardianConsent", "true");
    }
    const foto = form.get("foto");
    if (foto instanceof File && foto.size > 0) {
      payload.set("foto", foto);
    }

    const response = await secureFetch(
      `/api/auth/registro/${roleToPath[roleCodigo]}`,
      { method: "POST", body: payload },
    );
    const result = (await response.json()) as {
      error?: string;
      qrCodeHash?: string;
      user?: { id: string; nomeCompleto: string };
    };

    if (!response.ok || !result.qrCodeHash) {
      setError(result.error ?? "Não foi possível concluir a inscrição.");
      setLoading(false);
      return;
    }

    const params = new URLSearchParams({
      hash: result.qrCodeHash,
      nome: result.user?.nomeCompleto ?? "",
      perfil: roleCodigo,
    });
    router.push(`/auth/inscricao/confirmacao?${params.toString()}`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
      {titulo ? (
        <p className="sm:col-span-2 text-sm text-blue-gray">{titulo}</p>
      ) : null}

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="nomeCompleto">Nome completo</Label>
        <Input
          id="nomeCompleto"
          name="nomeCompleto"
          autoComplete="name"
          minLength={2}
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
        <Label htmlFor="telefone">Telefone</Label>
        <InputMask id="telefone" name="telefone" mask="phone" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="cpf">CPF</Label>
        <InputMask id="cpf" name="cpf" mask="cpf" required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="dataNascimento">Data de nascimento</Label>
        <Input
          id="dataNascimento"
          name="dataNascimento"
          type="date"
          required
          value={birth}
          onChange={(event) => setBirth(event.target.value)}
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="foto">Foto (opcional)</Label>
        <Input
          id="foto"
          name="foto"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (!file) {
              setPreview(null);
              return;
            }
            setPreview(URL.createObjectURL(file));
          }}
        />
        {preview ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-white/10 bg-black/20 p-2">
            <Image
              src={preview}
              alt="Pré-visualização da foto"
              width={160}
              height={160}
              className="mx-auto size-40 rounded-lg object-cover"
              unoptimized
            />
          </div>
        ) : null}
      </div>

      {roleCodigo !== "VISITANTE" ? (
        <>
          <div className="space-y-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmarSenha">Confirmar senha</Label>
            <Input
              id="confirmarSenha"
              name="confirmarSenha"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
            />
          </div>
        </>
      ) : (
        <p className="sm:col-span-2 rounded-xl border border-cyan-electric/15 bg-cyan-electric/[0.05] px-4 py-3 text-sm text-blue-gray">
          Visitante não usa login e senha. Depois da inscrição, consulte o QR
          Code pelo CPF no menu Visitante.
        </p>
      )}

      <div className="flex items-start gap-3 sm:col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <input
          id="aceitouDireitoImagem"
          name="aceitouDireitoImagem"
          type="checkbox"
          className={checkboxClassName}
          checked={aceitouDireitoImagem}
          onChange={(event) => setAceitouDireitoImagem(event.target.checked)}
          required
        />
        <Label
          htmlFor="aceitouDireitoImagem"
          className="cursor-pointer text-sm leading-6 text-blue-gray"
        >
          Autorizo o uso da minha imagem para divulgação do evento SNCT
          Paulista 2026.
        </Label>
      </div>

      <div className="flex items-start gap-3 sm:col-span-2 rounded-xl border border-white/10 bg-white/[0.03] p-4">
        <input
          id="privacyConsent"
          name="privacyConsent"
          type="checkbox"
          className={checkboxClassName}
          checked={privacyConsent}
          onChange={(event) => setPrivacyConsent(event.target.checked)}
          required
        />
        <Label
          htmlFor="privacyConsent"
          className="cursor-pointer text-sm leading-6 text-blue-gray"
        >
          Li e aceito o{" "}
          <Link
            href="/privacidade"
            className="text-cyan-electric underline"
            onClick={(event) => event.stopPropagation()}
          >
            aviso de privacidade
          </Link>
          .
        </Label>
      </div>

      {age !== null && age < 18 ? (
        <div className="flex items-start gap-3 sm:col-span-2 rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
          <input
            id="guardianConsent"
            name="guardianConsent"
            type="checkbox"
            className={checkboxClassName}
            checked={guardianConsent}
            onChange={(event) => setGuardianConsent(event.target.checked)}
            required
          />
          <Label
            htmlFor="guardianConsent"
            className="cursor-pointer text-sm leading-6 text-blue-gray"
          >
            Declaro que o responsável legal autoriza a participação do menor.
          </Label>
        </div>
      ) : null}

      {error ? (
        <p className="sm:col-span-2 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <div className="sm:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="inline-flex items-center gap-2 text-xs text-blue-gray">
          <ShieldCheck className="size-4 text-cyan-electric" aria-hidden />
          Senha protegida com Argon2id. O perfil é definido automaticamente.
        </p>
        <Button type="submit" variant="glow" disabled={loading}>
          {loading ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
          Concluir inscrição
        </Button>
      </div>
    </form>
  );
}

export { FormularioBaseUsuario };
