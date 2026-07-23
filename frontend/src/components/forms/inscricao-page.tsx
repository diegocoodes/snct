import { AuthFrame } from "@/components/auth/auth-frame";
import { FormularioBaseUsuario } from "@/components/forms/formulario-base-usuario";
import type { RoleCodigo } from "@/lib/snct-types";

const copy: Record<
  Extract<RoleCodigo, "AVALIADOR" | "PROFESSOR" | "VISITANTE">,
  { eyebrow: string; title: string; description: string }
> = {
  AVALIADOR: {
    eyebrow: "Inscrição de avaliador",
    title: "Cadastro de avaliador",
    description:
      "Preencha seus dados para receber a credencial QR e participar da avaliação no evento.",
  },
  PROFESSOR: {
    eyebrow: "Inscrição de professor",
    title: "Cadastro de professor",
    description:
      "Cadastre-se para criar sua escola, projetos e alunos — e usar seu QR Code no check-in.",
  },
  VISITANTE: {
    eyebrow: "Inscrição de visitante",
    title: "Cadastro de visitante",
    description:
      "Crie sua credencial individual. O QR Code será gerado automaticamente ao concluir.",
  },
};

function InscricaoPage({
  roleCodigo,
}: {
  roleCodigo: Extract<
    RoleCodigo,
    "AVALIADOR" | "PROFESSOR" | "VISITANTE"
  >;
}) {
  const content = copy[roleCodigo];
  return (
    <AuthFrame
      eyebrow={content.eyebrow}
      title={content.title}
      description={content.description}
    >
      <FormularioBaseUsuario roleCodigo={roleCodigo} />
    </AuthFrame>
  );
}

export { InscricaoPage };
