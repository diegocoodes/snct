"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  Gift,
  Keyboard,
  LoaderCircle,
  ScanLine,
  UserRound,
  VideoOff,
} from "lucide-react";
import QrScanner from "qr-scanner";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PublicUser } from "@/lib/snct-types";

function StaffScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const processingRef = useRef(false);
  const [cameraError, setCameraError] = useState("");
  const [manualToken, setManualToken] = useState("");
  const [visitor, setVisitor] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(false);

  async function processToken(
    token: string,
    action: "checkin" | "gift" = "checkin",
  ) {
    if (!token || processingRef.current) return;
    processingRef.current = true;
    setLoading(true);
    const response = await fetch("/api/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, action }),
    });
    const result = (await response.json()) as {
      error?: string;
      visitor?: PublicUser;
    };
    if (!response.ok || !result.visitor) {
      toast.error(result.error ?? "Não foi possível validar a credencial.");
    } else {
      setVisitor(result.visitor);
      setManualToken(result.visitor.visitorHash ?? token);
      toast.success(
        action === "gift"
          ? "Entrega do brinde registrada."
          : "Check-in confirmado.",
      );
      scannerRef.current?.stop();
    }
    setLoading(false);
    processingRef.current = false;
  }

  useEffect(() => {
    if (!videoRef.current) return;
    const scanner = new QrScanner(
      videoRef.current,
      (result) => void processToken(result.data),
      {
        preferredCamera: "environment",
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
        maxScansPerSecond: 5,
      },
    );
    scannerRef.current = scanner;
    scanner
      .start()
      .catch(() =>
        setCameraError(
          "Não foi possível acessar a câmera. Use a leitura manual abaixo.",
        ),
      );
    return () => scanner.destroy();
  }, []);

  function restartScanner() {
    setVisitor(null);
    setManualToken("");
    setCameraError("");
    scannerRef.current
      ?.start()
      .catch(() => setCameraError("Câmera indisponível neste dispositivo."));
  }

  return (
    <div>
      <div className="max-w-3xl">
        <p className="font-display text-sm tracking-[.2em] text-cyan-electric uppercase">
          Operação do evento
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ice-white sm:text-4xl">
          Check-in de visitantes
        </h1>
        <p className="mt-4 leading-7 text-blue-gray">
          Aponte a câmera para o QR Code pessoal. Depois da validação, registre
          a entrega do brinde quando aplicável.
        </p>
      </div>

      <div className="mt-9 grid gap-5 lg:grid-cols-[1.05fr_.95fr]">
        <Card className="overflow-hidden border-cyan-electric/20 bg-[#0b1020]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ScanLine className="size-5 text-cyan-electric" aria-hidden />{" "}
              Leitor de QR Code
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video overflow-hidden rounded-2xl border border-white/10 bg-black">
              <video
                ref={videoRef}
                className="size-full object-cover"
                muted
                playsInline
                aria-label="Imagem da câmera para leitura do QR Code"
              />
              {cameraError ? (
                <div className="absolute inset-0 grid place-items-center bg-[#090b14] p-6 text-center">
                  <div>
                    <VideoOff
                      className="mx-auto size-8 text-magenta-neon"
                      aria-hidden
                    />
                    <p className="mt-3 text-sm leading-6 text-blue-gray">
                      {cameraError}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
            <form
              className="mt-5 flex flex-col gap-3 sm:flex-row"
              onSubmit={(event) => {
                event.preventDefault();
                void processToken(manualToken);
              }}
            >
              <div className="relative flex-1">
                <Keyboard
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-blue-gray"
                  aria-hidden
                />
                <Input
                  value={manualToken}
                  onChange={(event) => setManualToken(event.target.value)}
                  className="pl-9"
                  placeholder="Cole a hash ou o conteúdo do QR Code"
                  aria-label="Hash do visitante"
                />
              </div>
              <Button type="submit" disabled={loading || !manualToken}>
                {loading ? (
                  <LoaderCircle
                    className="animate-spin motion-reduce:animate-none"
                    aria-hidden
                  />
                ) : (
                  <CheckCircle2 aria-hidden />
                )}{" "}
                Confirmar check-in
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-purple-vibrant/20">
          <CardHeader>
            <CardTitle>Visitante identificado</CardTitle>
          </CardHeader>
          <CardContent>
            {visitor ? (
              <div>
                <div className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-purple-vibrant/15 text-[#BDA5FF]">
                    <UserRound className="size-6" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold text-ice-white">
                      {visitor.name}
                    </p>
                    <p className="text-sm text-blue-gray">
                      {visitor.age} anos · {visitor.email}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge className="bg-emerald-500/15 text-emerald-300">
                        Check-in confirmado
                      </Badge>
                      {visitor.giftDeliveredAt ? (
                        <Badge className="bg-magenta-neon/15 text-[#FF9AE8]">
                          Brinde entregue
                        </Badge>
                      ) : null}
                    </div>
                  </div>
                </div>
                <Button
                  className="mt-4 w-full"
                  variant="glow"
                  disabled={Boolean(visitor.giftDeliveredAt) || loading}
                  onClick={() =>
                    void processToken(visitor.visitorHash ?? "", "gift")
                  }
                >
                  <Gift aria-hidden />{" "}
                  {visitor.giftDeliveredAt
                    ? "Brinde já entregue"
                    : "Registrar entrega do brinde"}
                </Button>
                <Button
                  className="mt-3 w-full"
                  variant="outline"
                  onClick={restartScanner}
                >
                  Ler próximo QR Code
                </Button>
              </div>
            ) : (
              <div className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-6 text-center">
                <div>
                  <ScanLine
                    className="mx-auto size-10 text-cyan-electric/65"
                    aria-hidden
                  />
                  <p className="mt-4 font-semibold text-ice-white">
                    Aguardando leitura
                  </p>
                  <p className="mt-2 max-w-xs text-sm leading-6 text-blue-gray">
                    Os dados do visitante e as ações de check-in aparecerão
                    aqui.
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export { StaffScanner };
