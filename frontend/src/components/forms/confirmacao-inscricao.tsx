"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Download, QrCode } from "lucide-react";
import QRCode from "qrcode";

import { AuthFrame } from "@/components/auth/auth-frame";
import { Button } from "@/components/ui/button";
import { ROLE_LABELS } from "@/lib/roles-constants";
import type { UserRole } from "@/lib/snct-types";
import { buildCredentialQrPayload } from "@/lib/qr-payload";

const codigoToRole: Record<string, UserRole> = {
  AVALIADOR: "avaliador",
  PROFESSOR: "professor",
  VISITANTE: "visitante",
  ALUNO: "aluno",
};

function ConfirmacaoInscricaoClient() {
  const params = useSearchParams();
  const hash = params.get("hash") ?? "";
  const nome = params.get("nome") ?? "Participante";
  const perfil = params.get("perfil") ?? "VISITANTE";
  const [qrCode, setQrCode] = useState("");

  const roleLabel = useMemo(() => {
    const role = codigoToRole[perfil] ?? "visitante";
    return ROLE_LABELS[role];
  }, [perfil]);

  const isVisitante = perfil === "VISITANTE";
  const isProfessor = perfil === "PROFESSOR";

  useEffect(() => {
    if (!hash) return;
    const payload = buildCredentialQrPayload(hash);
    void QRCode.toDataURL(payload, {
      width: 560,
      margin: 2,
      errorCorrectionLevel: "H",
      color: { dark: "#10002b", light: "#f7f7fb" },
    }).then(setQrCode);
  }, [hash]);

  if (!hash) {
    return (
      <AuthFrame
        eyebrow="Inscrição"
        title="Confirmação indisponível"
        description="Não encontramos a credencial. Refaça a inscrição."
      >
        <Button render={<Link href="/auth/inscricao/visitante" />}>
          Voltar às inscrições
        </Button>
      </AuthFrame>
    );
  }

  return (
    <AuthFrame
      eyebrow="Inscrição concluída"
      title={`Bem-vindo(a), ${nome.split(" ")[0]}`}
      description={
        isVisitante
          ? `Seu perfil de ${roleLabel} foi criado. Apresente este QR Code no check-in. Para consultá-lo depois, use o CPF no menu Visitante.`
          : isProfessor
            ? `Seu perfil de ${roleLabel} foi criado. No menu Escola e alunos você cadastra a escola, os temas e os alunos.`
            : `Seu perfil de ${roleLabel} foi criado. Apresente este QR Code no check-in diário.`
      }
    >
      <div className="mx-auto grid max-w-sm place-items-center gap-4">
        <div className="grid aspect-square w-full place-items-center rounded-3xl bg-ice-white p-4">
          {qrCode ? (
            <Image
              src={qrCode}
              alt="QR Code da credencial"
              width={560}
              height={560}
              className="size-full"
              unoptimized
            />
          ) : (
            <QrCode className="size-10 text-purple-deep/40" aria-hidden />
          )}
        </div>
        {qrCode ? (
          <Button
            variant="glow"
            className="w-full"
            render={<a href={qrCode} download={`credencial-snct.png`} />}
          >
            <Download aria-hidden /> Baixar QR Code
          </Button>
        ) : null}
        {isVisitante ? (
          <Button
            variant="outline"
            className="w-full"
            render={<Link href="/credencial" />}
          >
            Consultar pelo CPF
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              className="w-full"
              render={<Link href="/login" />}
            >
              Ir para o login
            </Button>
            <Button
              variant="ghost"
              className="w-full"
              render={<Link href="/meu-qrcode" />}
            >
              Ver no meu perfil
            </Button>
          </>
        )}
      </div>
    </AuthFrame>
  );
}

export { ConfirmacaoInscricaoClient };
