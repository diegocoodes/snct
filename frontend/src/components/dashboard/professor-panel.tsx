"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Download,
  FileText,
  LoaderCircle,
  Pencil,
  Plus,
  School,
  Trash2,
  Users,
  X,
} from "lucide-react";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InputMask } from "@/components/ui/input-mask";
import { Label } from "@/components/ui/label";
import { isValidCpf, onlyDigits } from "@/lib/cpf";
import { buildCredentialQrPayload } from "@/lib/qr-payload";
import { secureFetch } from "@/lib/secure-fetch";

const checkboxClassName =
  "mt-1 size-4 shrink-0 cursor-pointer rounded border border-cyan-electric/40 bg-[#111329] accent-cyan-electric";

type Step = "escola" | "temas" | "cadastro" | "inscritos";

type ProfessorEscola = {
  id: string;
  nome: string;
  cidade: string | null;
};

type ProfessorTema = {
  id: string;
  titulo: string;
  descricao: string | null;
  alunosCount: number;
};

type ProfessorAlunoDocumento = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
};

type ProfessorAluno = {
  id: string;
  temaId: string;
  usuarioId: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
  age: number;
  foto?: string;
  qrCodeHash: string;
  documentos: ProfessorAlunoDocumento[];
};

type PanelState = {
  escola: ProfessorEscola | null;
  temas: ProfessorTema[];
  alunosByTema: Record<string, ProfessorAluno[]>;
};

function formatCpf(raw: string) {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11) return raw;
  return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
}

function AlunoQrThumb({ hash, name }: { hash: string; name: string }) {
  const [src, setSrc] = useState("");

  useEffect(() => {
    let active = true;
    void QRCode.toDataURL(buildCredentialQrPayload(hash), {
      width: 220,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#10002b", light: "#f7f7fb" },
    }).then((value) => {
      if (active) setSrc(value);
    });
    return () => {
      active = false;
    };
  }, [hash]);

  if (!src) {
    return (
      <div className="size-14 animate-pulse rounded-lg bg-white/10 motion-reduce:animate-none" />
    );
  }

  return (
    <Image
      src={src}
      alt={`QR Code de ${name}`}
      width={56}
      height={56}
      className="size-14 rounded-lg"
      unoptimized
    />
  );
}

function ProfessorPanel() {
  const [panel, setPanel] = useState<PanelState>({
    escola: null,
    temas: [],
    alunosByTema: {},
  });
  const [step, setStep] = useState<Step>("escola");
  const [loading, setLoading] = useState(true);
  const [escolaNome, setEscolaNome] = useState("");
  const [editingEscola, setEditingEscola] = useState(false);
  const [addingTema, setAddingTema] = useState(false);
  const [editingTemaId, setEditingTemaId] = useState<string | null>(null);
  const [temaTitulo, setTemaTitulo] = useState("");
  const [temaDescricao, setTemaDescricao] = useState("");
  const [selectedTemaId, setSelectedTemaId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [birth, setBirth] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
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

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await secureFetch("/api/professor", {
          method: "GET",
          cache: "no-store",
        });
        const data = (await response.json().catch(() => null)) as
          | PanelState
          | null;
        if (!active || !response.ok || !data) return;
        setPanel(data);
        setEscolaNome(data.escola?.nome ?? "");
        setEditingEscola(!data.escola);
        setStep("escola");
        setSelectedTemaId(null);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const selectedTema =
    panel.temas.find((tema) => tema.id === selectedTemaId) ?? null;
  const alunos = selectedTema
    ? (panel.alunosByTema[selectedTema.id] ?? [])
    : [];

  function applyPanel(data: PanelState) {
    setPanel(data);
    if (data.escola) {
      setEscolaNome(data.escola.nome);
      setEditingEscola(false);
    } else {
      setEscolaNome("");
      setEditingEscola(true);
      setStep("escola");
      setSelectedTemaId(null);
    }
    if (
      selectedTemaId &&
      !data.temas.some((tema) => tema.id === selectedTemaId)
    ) {
      setSelectedTemaId(null);
      setStep(data.escola ? "temas" : "escola");
    }
  }

  async function mutateJson(
    method: "POST" | "DELETE",
    body: Record<string, unknown>,
    successMessage: string,
  ) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const response = await secureFetch("/api/professor", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await response.json().catch(() => null)) as
        | (PanelState & { error?: string })
        | null;
      if (!response.ok || !data) {
        setError(data?.error ?? "Não foi possível salvar.");
        return false;
      }
      applyPanel(data);
      setMessage(successMessage);
      return true;
    } catch {
      setError("Falha de rede. Tente novamente.");
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function onSaveEscola(event: FormEvent) {
    event.preventDefault();
    const ok = await mutateJson(
      "POST",
      { action: "saveEscola", nome: escolaNome, cidade: "Paulista" },
      "Escola salva.",
    );
    if (ok) setStep("temas");
  }

  async function onDeleteEscola() {
    if (
      !window.confirm(
        "Excluir a escola remove todos os temas e alunos. Continuar?",
      )
    ) {
      return;
    }
    const ok = await mutateJson(
      "DELETE",
      { action: "deleteEscola" },
      "Escola excluída.",
    );
    if (ok) {
      setStep("escola");
      setSelectedTemaId(null);
    }
  }

  async function onCreateTema(event: FormEvent) {
    event.preventDefault();
    const ok = await mutateJson(
      "POST",
      {
        action: "createTema",
        titulo: temaTitulo,
        descricao: temaDescricao,
      },
      "Tema cadastrado.",
    );
    if (ok) {
      setTemaTitulo("");
      setTemaDescricao("");
      setAddingTema(false);
    }
  }

  async function onUpdateTema(event: FormEvent) {
    event.preventDefault();
    if (!editingTemaId) return;
    const ok = await mutateJson(
      "POST",
      {
        action: "updateTema",
        temaId: editingTemaId,
        titulo: temaTitulo,
        descricao: temaDescricao,
      },
      "Tema atualizado.",
    );
    if (ok) {
      setEditingTemaId(null);
      setTemaTitulo("");
      setTemaDescricao("");
    }
  }

  async function onDeleteTema(temaId: string) {
    if (
      !window.confirm(
        "Excluir o tema remove os alunos cadastrados nele. Continuar?",
      )
    ) {
      return;
    }
    await mutateJson(
      "DELETE",
      { action: "deleteTema", temaId },
      "Tema removido.",
    );
  }

  function startEditTema(tema: ProfessorTema) {
    setAddingTema(false);
    setEditingTemaId(tema.id);
    setTemaTitulo(tema.titulo);
    setTemaDescricao(tema.descricao ?? "");
  }

  function openCadastro(temaId: string) {
    setSelectedTemaId(temaId);
    setStep("cadastro");
    setError("");
    setMessage("");
  }

  async function onCreateAluno(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedTema) return;

    const formEl = event.currentTarget;
    const form = new FormData(formEl);

    if (!isValidCpf(String(form.get("cpf") ?? ""))) {
      setError("Informe um CPF válido.");
      return;
    }
    if (!aceitouDireitoImagem) {
      setError("Aceite o direito de uso de imagem para concluir.");
      return;
    }
    if (!privacyConsent) {
      setError("Aceite o aviso de privacidade para continuar.");
      return;
    }
    if (age !== null && age < 18 && !guardianConsent) {
      setError("O consentimento do responsável é obrigatório para menores.");
      return;
    }
    const autorizacao = form.get("autorizacao");
    if (
      age !== null &&
      age < 18 &&
      (!(autorizacao instanceof File) || autorizacao.size < 1)
    ) {
      setError(
        "Anexe o documento de autorização dos pais/responsáveis para menores.",
      );
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    const payload = new FormData();
    payload.set("action", "createAluno");
    payload.set("temaId", selectedTema.id);
    payload.set("nomeCompleto", String(form.get("nomeCompleto") ?? "").trim());
    payload.set("email", String(form.get("email") ?? "").trim().toLowerCase());
    payload.set("telefone", onlyDigits(String(form.get("telefone") ?? "")));
    payload.set("cpf", onlyDigits(String(form.get("cpf") ?? "")));
    payload.set("dataNascimento", String(form.get("dataNascimento") ?? ""));
    payload.set(
      "aceitouDireitoImagem",
      aceitouDireitoImagem ? "true" : "false",
    );
    payload.set("privacyConsent", privacyConsent ? "true" : "false");
    if (guardianConsent) payload.set("guardianConsent", "true");

    const foto = form.get("foto");
    if (foto instanceof File && foto.size > 0) {
      payload.set("foto", foto);
    }
    if (autorizacao instanceof File && autorizacao.size > 0) {
      payload.set("autorizacao", autorizacao);
    }

    try {
      const response = await secureFetch("/api/professor", {
        method: "POST",
        body: payload,
      });
      const data = (await response.json().catch(() => null)) as
        | (PanelState & { error?: string })
        | null;
      if (!response.ok || !data) {
        setError(data?.error ?? "Não foi possível cadastrar o aluno.");
        return;
      }
      applyPanel(data);
      setMessage("Aluno cadastrado neste tema.");
      formEl.reset();
      setBirth("");
      setPreview(null);
      setAceitouDireitoImagem(false);
      setPrivacyConsent(false);
      setGuardianConsent(false);
    } catch {
      setError("Falha de rede. Tente novamente.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="text-blue-gray">Carregando painel do professor…</p>;
  }

  const title =
    step === "escola"
      ? "Sua escola"
      : step === "temas"
        ? "Temas"
        : step === "inscritos"
          ? `Alunos — ${selectedTema?.titulo ?? ""}`
          : `Cadastrar alunos — ${selectedTema?.titulo ?? ""}`;

  return (
    <div className="space-y-6">
      <header className="max-w-3xl">
        <p className="font-display text-sm tracking-[.2em] text-cyan-electric uppercase">
          Escola e alunos
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ice-white sm:text-4xl">
          {title}
        </h1>
        <p className="mt-3 leading-7 text-blue-gray">
          {step === "escola"
            ? "Edite ou exclua a escola, ou clique nela para ver os temas."
            : step === "temas"
              ? "Edite ou exclua temas, ou abra um tema para cadastrar alunos."
              : step === "inscritos"
                ? "Alunos já inscritos neste tema."
                : "Preencha os dados para inscrever um aluno neste tema."}
        </p>
      </header>

      {panel.escola && step !== "escola" ? (
        <nav
          aria-label="Navegação"
          className="flex flex-wrap items-center gap-1 text-sm text-blue-gray"
        >
          <button
            type="button"
            className="hover:text-cyan-electric"
            onClick={() => {
              setStep("escola");
              setSelectedTemaId(null);
            }}
          >
            {panel.escola.nome}
          </button>
          <ChevronRight className="size-4 opacity-50" aria-hidden />
          {step === "temas" ? (
            <span className="text-ice-white">Temas</span>
          ) : (
            <>
              <button
                type="button"
                className="hover:text-cyan-electric"
                onClick={() => {
                  setStep("temas");
                  setSelectedTemaId(null);
                }}
              >
                Temas
              </button>
              <ChevronRight className="size-4 opacity-50" aria-hidden />
              <span className="text-ice-white">
                {selectedTema?.titulo ?? "Tema"}
              </span>
            </>
          )}
        </nav>
      ) : null}

      {(error || message) && (
        <p
          role="status"
          className={
            error
              ? "rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              : "rounded-xl border border-cyan-electric/30 bg-cyan-electric/10 px-4 py-3 text-sm text-cyan-100"
          }
        >
          {error || message}
        </p>
      )}

      {/* Escola */}
      {step === "escola" ? (
        <section className="space-y-4">
          {panel.escola && !editingEscola ? (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5">
              <button
                type="button"
                onClick={() => setStep("temas")}
                className="group flex min-w-0 flex-1 items-center gap-4 text-left"
              >
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-cyan-electric/10 text-cyan-electric">
                  <School className="size-6" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-display text-xl font-semibold text-ice-white">
                    {panel.escola.nome}
                  </span>
                  <span className="mt-1 block text-sm text-blue-gray">
                    Paulista · {panel.temas.length} tema
                    {panel.temas.length === 1 ? "" : "s"}
                  </span>
                </span>
                <ChevronRight
                  className="hidden size-5 shrink-0 text-blue-gray transition group-hover:text-cyan-electric sm:block"
                  aria-hidden
                />
              </button>
              <div className="flex shrink-0 gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Editar escola"
                  onClick={() => setEditingEscola(true)}
                >
                  <Pencil className="size-4" aria-hidden />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  disabled={busy}
                  aria-label="Excluir escola"
                  onClick={() => void onDeleteEscola()}
                >
                  <Trash2 className="size-4 text-red-300" aria-hidden />
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={onSaveEscola} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs tracking-[0.18em] text-blue-gray uppercase">
                  {panel.escola ? "Editar escola" : "Cadastre sua escola"}
                </p>
                {panel.escola ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingEscola(false);
                      setEscolaNome(panel.escola?.nome ?? "");
                    }}
                  >
                    <X className="size-4" aria-hidden />
                    Cancelar
                  </Button>
                ) : null}
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 space-y-2">
                  <Label htmlFor="escola-nome">Nome da escola</Label>
                  <Input
                    id="escola-nome"
                    value={escolaNome}
                    onChange={(event) => setEscolaNome(event.target.value)}
                    placeholder="Ex.: Escola Zulmira de Paula"
                    required
                  />
                </div>
                <div className="w-full space-y-1 sm:w-40">
                  <Label>Cidade</Label>
                  <p className="flex h-11 items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 text-sm text-ice-white">
                    Paulista
                  </p>
                </div>
                <Button type="submit" disabled={busy} className="shrink-0">
                  <Check className="size-4" aria-hidden />
                  {panel.escola ? "Salvar" : "Continuar"}
                </Button>
              </div>
            </form>
          )}
        </section>
      ) : null}

      {/* Temas */}
      {step === "temas" && panel.escola ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep("escola")}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Voltar
            </Button>
            {!addingTema && !editingTemaId ? (
              <Button
                type="button"
                variant="glow"
                size="sm"
                onClick={() => {
                  setEditingTemaId(null);
                  setTemaTitulo("");
                  setTemaDescricao("");
                  setAddingTema(true);
                }}
              >
                <Plus className="size-4" aria-hidden />
                Novo tema
              </Button>
            ) : null}
          </div>

          {addingTema || editingTemaId ? (
            <form
              onSubmit={editingTemaId ? onUpdateTema : onCreateTema}
              className="flex flex-col gap-3 rounded-2xl border border-dashed border-cyan-electric/30 bg-cyan-electric/[0.03] p-4 sm:flex-row sm:items-end"
            >
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="tema-titulo">Título</Label>
                <Input
                  id="tema-titulo"
                  value={temaTitulo}
                  onChange={(event) => setTemaTitulo(event.target.value)}
                  placeholder="Ex.: Robótica educacional"
                  required
                  autoFocus
                />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Label htmlFor="tema-descricao">Descrição</Label>
                <Input
                  id="tema-descricao"
                  value={temaDescricao}
                  onChange={(event) => setTemaDescricao(event.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={busy} size="sm">
                  <Check className="size-4" aria-hidden />
                  {editingTemaId ? "Salvar" : "Adicionar"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setAddingTema(false);
                    setEditingTemaId(null);
                    setTemaTitulo("");
                    setTemaDescricao("");
                  }}
                >
                  <X className="size-4" aria-hidden />
                </Button>
              </div>
            </form>
          ) : null}

          {panel.temas.length === 0 ? (
            <p className="text-sm text-blue-gray">
              Nenhum tema ainda. Crie o primeiro para cadastrar alunos.
            </p>
          ) : (
            <ul className="space-y-2">
              {panel.temas.map((tema) => (
                <li
                  key={tema.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] px-4 py-4"
                >
                  <div className="flex flex-wrap items-start gap-3">
                    <button
                      type="button"
                      onClick={() => openCadastro(tema.id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <span className="block font-medium text-ice-white">
                        {tema.titulo}
                      </span>
                      <span className="mt-1 block text-sm text-blue-gray">
                        {tema.alunosCount} aluno
                        {tema.alunosCount === 1 ? "" : "s"}
                        {tema.descricao ? ` · ${tema.descricao}` : ""}
                      </span>
                    </button>
                    <div className="flex shrink-0 flex-wrap gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Editar ${tema.titulo}`}
                        onClick={() => startEditTema(tema)}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        disabled={busy}
                        aria-label={`Excluir ${tema.titulo}`}
                        onClick={() => void onDeleteTema(tema.id)}
                      >
                        <Trash2 className="size-4 text-red-300" aria-hidden />
                      </Button>
                      <Button
                        type="button"
                        variant="glow"
                        size="sm"
                        onClick={() => openCadastro(tema.id)}
                      >
                        Cadastrar alunos
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      {/* Cadastro de alunos no tema */}
      {step === "cadastro" && selectedTema ? (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setStep("temas");
                setSelectedTemaId(null);
              }}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Voltar aos temas
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep("inscritos")}
            >
              <Users className="size-4" aria-hidden />
              Ver alunos inscritos no tema
              {alunos.length > 0 ? ` (${alunos.length})` : ""}
            </Button>
          </div>

          <div className="rounded-2xl border border-cyan-electric/25 bg-cyan-electric/[0.05] px-4 py-3 text-sm text-cyan-100">
            Você está cadastrando alunos no tema{" "}
            <strong className="text-ice-white">{selectedTema.titulo}</strong>.
          </div>

          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(event) => void onCreateAluno(event)}
          >
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="aluno-nome">Nome completo</Label>
              <Input
                id="aluno-nome"
                name="nomeCompleto"
                autoComplete="name"
                minLength={2}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aluno-email">E-mail</Label>
              <Input
                id="aluno-email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aluno-telefone">Telefone</Label>
              <InputMask
                id="aluno-telefone"
                name="telefone"
                mask="phone"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aluno-cpf">CPF</Label>
              <InputMask id="aluno-cpf" name="cpf" mask="cpf" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="aluno-nascimento">Data de nascimento</Label>
              <Input
                id="aluno-nascimento"
                name="dataNascimento"
                type="date"
                required
                value={birth}
                onChange={(event) => setBirth(event.target.value)}
              />
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="aluno-foto">Foto (opcional)</Label>
              <Input
                id="aluno-foto"
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
                <Image
                  src={preview}
                  alt="Pré-visualização da foto"
                  width={120}
                  height={120}
                  className="mt-3 size-28 rounded-xl object-cover"
                  unoptimized
                />
              ) : null}
            </div>

            {age !== null && age < 18 ? (
              <>
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="aluno-autorizacao">
                    Autorização dos pais/responsáveis
                  </Label>
                  <Input
                    id="aluno-autorizacao"
                    name="autorizacao"
                    type="file"
                    accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp,application/pdf"
                    required
                  />
                  <p className="text-xs text-blue-gray">
                    Obrigatório para menores · PDF, DOC, DOCX ou imagem até 10
                    MB
                  </p>
                </div>

                <label className="flex items-start gap-3 sm:col-span-2 text-sm leading-6 text-blue-gray">
                  <input
                    id="aluno-guardian"
                    name="guardianConsent"
                    type="checkbox"
                    className={checkboxClassName}
                    checked={guardianConsent}
                    onChange={(event) =>
                      setGuardianConsent(event.target.checked)
                    }
                    required
                  />
                  Declaro que o responsável legal autoriza a participação do
                  menor e que o documento anexado é válido.
                </label>
              </>
            ) : null}

            <label className="flex items-start gap-3 sm:col-span-2 text-sm leading-6 text-blue-gray">
              <input
                id="aluno-imagem"
                type="checkbox"
                className={checkboxClassName}
                checked={aceitouDireitoImagem}
                onChange={(event) =>
                  setAceitouDireitoImagem(event.target.checked)
                }
                required
              />
              Autorizo o uso da imagem do aluno para divulgação do evento SNCT
              Paulista 2026.
            </label>

            <label className="flex items-start gap-3 sm:col-span-2 text-sm leading-6 text-blue-gray">
              <input
                id="aluno-privacy"
                type="checkbox"
                className={checkboxClassName}
                checked={privacyConsent}
                onChange={(event) => setPrivacyConsent(event.target.checked)}
                required
              />
              <span>
                Li e aceito o{" "}
                <Link
                  href="/privacidade"
                  className="text-cyan-electric underline"
                  onClick={(event) => event.stopPropagation()}
                >
                  aviso de privacidade
                </Link>
                .
              </span>
            </label>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={busy} variant="glow">
                {busy ? (
                  <LoaderCircle className="animate-spin" aria-hidden />
                ) : (
                  <Plus className="size-4" aria-hidden />
                )}
                Cadastrar aluno neste tema
              </Button>
            </div>
          </form>
        </section>
      ) : null}

      {/* Lista de inscritos */}
      {step === "inscritos" && selectedTema ? (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep("cadastro")}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Voltar ao cadastro
            </Button>
            <Button
              type="button"
              variant="glow"
              size="sm"
              onClick={() => setStep("cadastro")}
            >
              <Plus className="size-4" aria-hidden />
              Cadastrar outro aluno
            </Button>
          </div>

          <p className="text-xs tracking-[0.18em] text-blue-gray uppercase">
            {alunos.length} aluno{alunos.length === 1 ? "" : "s"} inscrito
            {alunos.length === 1 ? "" : "s"} em {selectedTema.titulo}
          </p>

          {alunos.length === 0 ? (
            <p className="rounded-xl border border-dashed border-white/15 px-4 py-6 text-sm text-blue-gray">
              Nenhum aluno inscrito neste tema ainda.
            </p>
          ) : (
            <ul className="divide-y divide-white/10 border-y border-white/10">
              {alunos.map((aluno) => (
                <li
                  key={aluno.id}
                  className="flex items-start gap-3 py-4 first:pt-3 last:pb-3"
                >
                  <AlunoQrThumb
                    hash={aluno.qrCodeHash}
                    name={aluno.nomeCompleto}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ice-white">
                      {aluno.nomeCompleto}
                    </p>
                    <p className="mt-0.5 text-xs text-blue-gray">
                      CPF {formatCpf(aluno.cpf)} · {aluno.age} anos
                    </p>
                    <p className="truncate text-xs text-blue-gray">
                      {aluno.email}
                    </p>
                    {aluno.documentos.length > 0 ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {aluno.documentos.map((doc) => (
                          <a
                            key={doc.id}
                            href={`/api/professor?documentId=${encodeURIComponent(doc.id)}`}
                            className="inline-flex items-center gap-1 text-xs text-cyan-electric hover:underline"
                          >
                            <FileText className="size-3.5" aria-hidden />
                            {doc.name}
                            <Download className="size-3.5" aria-hidden />
                          </a>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    disabled={busy}
                    aria-label={`Remover ${aluno.nomeCompleto}`}
                    onClick={() =>
                      void mutateJson(
                        "DELETE",
                        {
                          action: "deleteAluno",
                          alunoId: aluno.id,
                        },
                        "Aluno removido.",
                      )
                    }
                  >
                    <Trash2 className="size-4 text-red-300" aria-hidden />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
    </div>
  );
}

export { ProfessorPanel };
