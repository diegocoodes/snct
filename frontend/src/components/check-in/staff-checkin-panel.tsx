"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  History,
  LoaderCircle,
  ScanLine,
  Search,
  UserRound,
  VideoOff,
  X,
} from "lucide-react";
import QrScanner from "qr-scanner";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CheckinMetodo, StaffUserView } from "@/lib/snct-types";
import { extractQrHash } from "@/lib/qr-payload";
import { secureFetch } from "@/lib/secure-fetch";
import { cn } from "@/lib/utils";

type Mode = "scanner" | "participant" | "search";

function StaffCheckinPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const processingRef = useRef(false);
  const loadByHashRef = useRef<(hash: string) => Promise<void>>(async () => {});

  const initialMode: Mode =
    searchParams.get("busca") === "1" ? "search" : "scanner";

  const [mode, setMode] = useState<Mode>(initialMode);
  const [cameraError, setCameraError] = useState("");
  const [metodo, setMetodo] = useState<CheckinMetodo>("QRCODE");
  const [termo, setTermo] = useState("");
  const [usuario, setUsuario] = useState<StaffUserView | null>(null);
  const [lista, setLista] = useState<StaffUserView[]>([]);
  const [loading, setLoading] = useState(false);
  const [scannerReady, setScannerReady] = useState(0);

  const destroyScanner = useCallback(() => {
    const scanner = scannerRef.current;
    scannerRef.current = null;
    if (!scanner) return;
    try {
      scanner.stop();
    } catch {
      // ignore
    }
    try {
      scanner.destroy();
    } catch {
      // ignore
    }
  }, []);

  const goToScanner = useCallback(() => {
    processingRef.current = false;
    setUsuario(null);
    setLista([]);
    setTermo("");
    setMetodo("QRCODE");
    setCameraError("");
    setMode("scanner");
    setScannerReady((value) => value + 1);
    router.replace(pathname);
  }, [pathname, router]);

  const goToSearch = useCallback(() => {
    destroyScanner();
    setUsuario(null);
    setMode("search");
    router.replace(`${pathname}?busca=1`);
  }, [destroyScanner, pathname, router]);

  const showParticipant = useCallback(
    (user: StaffUserView, nextMetodo: CheckinMetodo) => {
      destroyScanner();
      setUsuario(user);
      setMetodo(nextMetodo);
      setMode("participant");
      setLista([]);
      if (user.checkinHoje) {
        toast.message("Check-in do dia já realizado.");
      }
    },
    [destroyScanner],
  );

  const loadByHash = useCallback(
    async (raw: string) => {
      const clean = extractQrHash(raw);
      if (!clean || processingRef.current) return;
      processingRef.current = true;
      setLoading(true);
      try {
        const response = await secureFetch(
          `/api/checkins/usuario/${encodeURIComponent(clean)}`,
        );
        const result = (await response.json()) as {
          error?: string;
          usuario?: StaffUserView;
        };
        if (!response.ok || !result.usuario) {
          toast.error(result.error ?? "Participante não encontrado.");
          processingRef.current = false;
          return;
        }
        showParticipant(result.usuario, "QRCODE");
        router.replace(pathname);
      } finally {
        setLoading(false);
      }
    },
    [pathname, router, showParticipant],
  );

  loadByHashRef.current = loadByHash;

  async function search(term: string) {
    setLoading(true);
    const response = await secureFetch(
      `/api/checkins/buscar?termo=${encodeURIComponent(term)}`,
    );
    const result = (await response.json()) as {
      error?: string;
      participantes?: StaffUserView[];
    };
    if (!response.ok) {
      toast.error(result.error ?? "Falha na busca.");
      setLista([]);
    } else {
      setLista(result.participantes ?? []);
      if ((result.participantes ?? []).length === 0) {
        toast.message("Nenhum participante encontrado.");
      }
    }
    setLoading(false);
  }

  async function confirmCheckin(user: StaffUserView) {
    setLoading(true);
    const response = await secureFetch("/api/checkins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario_id: user.id, metodo }),
    });
    const result = (await response.json()) as {
      error?: string;
      usuario?: StaffUserView;
    };
    if (!response.ok) {
      toast.error(result.error ?? "Não foi possível registrar o check-in.");
      if (result.usuario) setUsuario(result.usuario);
    } else if (result.usuario) {
      setUsuario(result.usuario);
      toast.success("Check-in confirmado.");
    }
    setLoading(false);
  }

  useEffect(() => {
    if (searchParams.get("busca") === "1") {
      setMode((current) => (current === "participant" ? current : "search"));
      return;
    }
    const qrParam = searchParams.get("qr");
    if (qrParam) {
      void loadByHash(qrParam);
    }
  }, [searchParams, loadByHash]);

  // Mantém o <video> sempre montado; recria o scanner ao voltar para o modo scanner.
  useEffect(() => {
    if (mode !== "scanner") {
      destroyScanner();
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;
    const scanner = new QrScanner(
      video,
      (result) => void loadByHashRef.current(result.data),
      {
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
        maxScansPerSecond: 4,
      },
    );
    scannerRef.current = scanner;

    void scanner
      .start()
      .then(() => {
        if (cancelled) return;
        setCameraError("");
        processingRef.current = false;
      })
      .catch(() => {
        if (cancelled) return;
        setCameraError("Câmera indisponível. Use a busca manual pelo nome.");
      });

    return () => {
      cancelled = true;
      destroyScanner();
    };
  }, [mode, scannerReady, destroyScanner]);

  return (
    <div className="space-y-6">
      {/* Vídeo sempre no DOM para não perder a câmera ao trocar de tela */}
      <div className={cn(mode !== "scanner" && "hidden")}>
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <Card className="overflow-hidden border-cyan-electric/25 bg-[#0b1020] shadow-[0_20px_60px_rgb(0_229_255/8%)]">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-3 text-xl sm:text-2xl">
                <ScanLine className="size-6 text-cyan-electric sm:size-7" aria-hidden />
                Scanner de QR Code
                {loading ? (
                  <LoaderCircle
                    className="size-5 animate-spin text-cyan-electric"
                    aria-hidden
                  />
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pb-6">
              <div className="relative overflow-hidden rounded-3xl border border-cyan-electric/15 bg-black/50 shadow-[inset_0_0_40px_rgb(0_0_0/35%)]">
                <video
                  ref={videoRef}
                  className="aspect-[3/4] w-full object-cover sm:aspect-[4/3] min-h-[22rem] sm:min-h-[28rem]"
                  muted
                  playsInline
                />
                {cameraError ? (
                  <div className="absolute inset-0 grid place-items-center bg-black/70 p-6 text-center">
                    <div>
                      <VideoOff
                        className="mx-auto size-10 text-blue-gray"
                        aria-hidden
                      />
                      <p className="mt-3 text-sm text-blue-gray sm:text-base">
                        {cameraError}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
              <Button
                variant="glow"
                size="lg"
                className="h-14 w-full gap-3 rounded-2xl text-base font-semibold shadow-[0_0_28px_rgb(0_229_255/18%)]"
                onClick={goToSearch}
              >
                <Search className="size-5" aria-hidden /> Busca manual
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {mode === "participant" && usuario ? (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={goToScanner}>
              <ArrowLeft aria-hidden /> Cancelar
            </Button>
            <Button variant="ghost" onClick={goToScanner}>
              <ScanLine aria-hidden /> Buscar outra pessoa
            </Button>
          </div>

          <Card className="border-cyan-electric/25 bg-[#0b1020]/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="size-5 text-cyan-electric" aria-hidden />
                Cadastro do participante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
                <div className="size-36 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-black/20">
                  {usuario.foto ? (
                    <Image
                      src={usuario.foto}
                      alt={usuario.nomeCompleto}
                      width={144}
                      height={144}
                      className="size-full object-cover"
                      unoptimized
                    />
                  ) : (
                    <div className="grid size-full place-items-center text-blue-gray">
                      <UserRound className="size-12" aria-hidden />
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-3 text-center sm:text-left">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h2 className="text-2xl font-semibold text-ice-white">
                      {usuario.nomeCompleto}
                    </h2>
                    <Badge>{usuario.roleNome}</Badge>
                    <Badge variant={usuario.ativo ? "default" : "outline"}>
                      {usuario.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="grid gap-1 text-sm text-blue-gray">
                    <p>E-mail: {usuario.email}</p>
                    <p>CPF: {usuario.cpfMascarado}</p>
                    <p>Telefone: {usuario.telefoneMascarado}</p>
                  </div>
                  <p className="inline-flex items-center gap-2 text-sm">
                    <CheckCircle2
                      className={
                        usuario.checkinHoje
                          ? "size-4 text-emerald-400"
                          : "size-4 text-blue-gray"
                      }
                      aria-hidden
                    />
                    <span className="text-ice-white">
                      {usuario.checkinHoje
                        ? "Check-in de hoje já realizado"
                        : "Aguardando check-in"}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="glow"
                  className="flex-1"
                  disabled={loading || usuario.checkinHoje || !usuario.ativo}
                  onClick={() => void confirmCheckin(usuario)}
                >
                  {loading ? (
                    <LoaderCircle className="animate-spin" aria-hidden />
                  ) : (
                    <CheckCircle2 aria-hidden />
                  )}
                  Check-in
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={goToScanner}
                >
                  <X aria-hidden /> Cancelar
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={goToScanner}
                >
                  <ScanLine aria-hidden /> Buscar outra pessoa
                </Button>
              </div>

              <div>
                <p className="mb-2 inline-flex items-center gap-2 text-sm font-medium text-ice-white">
                  <History className="size-4 text-cyan-electric" aria-hidden />
                  Histórico
                </p>
                <ul className="space-y-1 text-sm text-blue-gray">
                  {usuario.historicoCheckins.length === 0 ? (
                    <li>Nenhum check-in registrado.</li>
                  ) : (
                    usuario.historicoCheckins.map((item) => (
                      <li key={item.id}>
                        {item.dataCheckin} · {item.metodo} ·{" "}
                        {new Date(item.horarioCheckin).toLocaleTimeString(
                          "pt-BR",
                        )}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {mode === "search" ? (
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-sm tracking-[.2em] text-cyan-electric uppercase">
                Busca manual
              </p>
              <h1 className="mt-2 font-display text-3xl font-semibold text-ice-white">
                Buscar por nome
              </h1>
            </div>
            <Button variant="outline" onClick={goToScanner}>
              <ScanLine aria-hidden /> Voltar ao scanner
            </Button>
          </div>

          <Card>
            <CardContent className="space-y-4 pt-6">
              <form
                className="flex gap-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (termo.trim().length >= 2) void search(termo.trim());
                }}
              >
                <Input
                  value={termo}
                  onChange={(event) => setTermo(event.target.value)}
                  placeholder="Digite o nome do participante"
                  autoFocus
                />
                <Button
                  type="submit"
                  disabled={loading || termo.trim().length < 2}
                >
                  {loading ? (
                    <LoaderCircle className="animate-spin" aria-hidden />
                  ) : (
                    <Search aria-hidden />
                  )}
                  Buscar
                </Button>
              </form>

              <div className="max-h-[28rem] space-y-2 overflow-y-auto">
                {lista.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="flex w-full items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left hover:border-cyan-electric/30"
                    onClick={() => showParticipant(item, "NOME")}
                  >
                    <span>
                      <span className="block font-medium text-ice-white">
                        {item.nomeCompleto}
                      </span>
                      <span className="text-xs text-blue-gray">
                        {item.roleNome} · {item.cpfMascarado}
                      </span>
                    </span>
                    <Badge variant={item.checkinHoje ? "default" : "outline"}>
                      {item.checkinHoje ? "Check-in ok" : "Pendente"}
                    </Badge>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}

export { StaffCheckinPanel };
