"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  CheckCircle2,
  Download,
  Gift,
  Hash,
  QrCode,
  UserRound,
} from "lucide-react";
import QRCode from "qrcode";

import { Badge } from "@/components/ui/badge";
import { AccountSecurity } from "@/components/dashboard/account-security";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PublicUser } from "@/lib/snct-types";

function VisitorPass({ visitor }: { visitor: PublicUser }) {
  const [qrCode, setQrCode] = useState("");
  const qrValue = `SNCT:${visitor.visitorHash ?? visitor.id}`;

  useEffect(() => {
    QRCode.toDataURL(qrValue, {
      width: 560,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#10002b", light: "#f7f7fb" },
    }).then(setQrCode);
  }, [qrValue]);

  return (
    <div>
      <div className="max-w-3xl">
        <p className="font-display text-sm tracking-[.2em] text-cyan-electric uppercase">
          Minha credencial
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ice-white sm:text-4xl">
          Olá, {visitor.name.split(" ")[0]}
        </h1>
        <p className="mt-4 leading-7 text-blue-gray">
          Apresente este QR Code à equipe Staff. Ele é exclusivo, pessoal e
          vinculado à hash do seu perfil.
        </p>
      </div>

      <div className="mt-9 grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
        <Card className="relative overflow-hidden border-cyan-electric/20 bg-[#101226]/90">
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-electric via-purple-vibrant to-magenta-neon"
          />
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <Badge className="bg-purple-vibrant text-white">SNCT 2026</Badge>
              <QrCode className="size-5 text-cyan-electric" aria-hidden />
            </div>
            <CardTitle className="mt-4 text-2xl">
              Credencial de visitante
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mx-auto grid aspect-square max-w-72 place-items-center rounded-3xl bg-ice-white p-4 shadow-[0_0_45px_rgb(0_229_255/15%)]">
              {qrCode ? (
                <Image
                  src={qrCode}
                  alt={`QR Code pessoal de ${visitor.name}`}
                  width={560}
                  height={560}
                  className="size-full"
                  unoptimized
                />
              ) : (
                <div className="size-full animate-pulse rounded-2xl bg-black/10 motion-reduce:animate-none" />
              )}
            </div>
            {qrCode ? (
              <Button
                variant="glow"
                className="mt-5 w-full"
                render={
                  <a
                    href={qrCode}
                    download={`credencial-snct-${visitor.id}.png`}
                  />
                }
              >
                <Download aria-hidden /> Baixar QR Code
              </Button>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid content-start gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-cyan-electric/10 text-cyan-electric">
                <UserRound className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs tracking-wide text-blue-gray uppercase">
                  Nome e idade
                </p>
                <p className="mt-1 font-semibold text-ice-white">
                  {visitor.name}
                </p>
                <p className="text-sm text-blue-gray">{visitor.age} anos</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-start gap-4">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-purple-vibrant/15 text-[#BDA5FF]">
                <Hash className="size-5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-xs tracking-wide text-blue-gray uppercase">
                  Identificador
                </p>
                <p className="mt-1 break-all font-mono text-xs text-ice-white">
                  {visitor.id}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle>Status no evento</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                <CheckCircle2
                  className={
                    visitor.checkedInAt
                      ? "size-5 text-emerald-400"
                      : "size-5 text-blue-gray"
                  }
                  aria-hidden
                />
                <div>
                  <p className="font-semibold text-ice-white">Check-in</p>
                  <p className="text-xs text-blue-gray">
                    {visitor.checkedInAt
                      ? "Confirmado pela equipe"
                      : "Aguardando chegada"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-4">
                <Gift
                  className={
                    visitor.giftDeliveredAt
                      ? "size-5 text-magenta-neon"
                      : "size-5 text-blue-gray"
                  }
                  aria-hidden
                />
                <div>
                  <p className="font-semibold text-ice-white">Brinde</p>
                  <p className="text-xs text-blue-gray">
                    {visitor.giftDeliveredAt
                      ? "Entrega registrada"
                      : "Ainda não entregue"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <AccountSecurity />
    </div>
  );
}

export { VisitorPass };
