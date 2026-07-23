import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthFrame } from "@/components/auth/auth-frame";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/auth";

const options = [
  {
    href: "/auth/inscricao/avaliador",
    title: "Avaliador",
    description: "Para quem participa da avaliação das atividades.",
  },
  {
    href: "/auth/inscricao/professor",
    title: "Professor",
    description: "Cadastre sua escola, projetos e alunos no evento.",
  },
  {
    href: "/auth/inscricao/visitante",
    title: "Visitante",
    description: "Para o público geral da SNCT.",
  },
] as const;

export default async function Page() {
  if (await getSession()) redirect("/perfil");

  return (
    <AuthFrame
      eyebrow="Inscrições SNCT"
      title="Escolha seu perfil"
      description="Cada formulário define automaticamente a função correspondente. Administrador e Staff são criados apenas no painel."
    >
      <div className="grid gap-3">
        {options.map((option) => (
          <Link
            key={option.href}
            href={option.href}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-cyan-electric/40"
          >
            <p className="font-semibold text-ice-white">{option.title}</p>
            <p className="mt-1 text-sm text-blue-gray">{option.description}</p>
          </Link>
        ))}
        <Button variant="outline" className="mt-2" render={<Link href="/login" />}>
          Já tenho conta
        </Button>
      </div>
    </AuthFrame>
  );
}
