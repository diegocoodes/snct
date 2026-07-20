import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

function AuthFrame({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative grid min-h-svh overflow-hidden bg-purple-deep lg:grid-cols-[.92fr_1.08fr]">
      <div aria-hidden className="absolute inset-0 circuit-grid opacity-35" />
      <div
        aria-hidden
        className="absolute -top-40 -left-32 size-[34rem] rounded-full bg-purple-vibrant/30 blur-[130px]"
      />
      <div
        aria-hidden
        className="absolute -right-40 bottom-0 size-[32rem] rounded-full bg-magenta-neon/20 blur-[140px]"
      />

      <section className="relative hidden min-h-svh flex-col justify-between border-r border-white/10 p-12 lg:flex xl:p-16">
        <Link
          href="/"
          className="inline-flex w-fit items-center gap-2 text-sm text-blue-gray transition-colors hover:text-ice-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-electric"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar ao portal
        </Link>

        <div>
          <Badge
            className="border-cyan-electric/25 bg-cyan-electric/10 text-cyan-electric"
            variant="outline"
          >
            <Sparkles data-icon="inline-start" aria-hidden />
            Área do evento
          </Badge>
          <h2 className="mt-6 max-w-xl font-display text-4xl leading-tight font-semibold text-ice-white xl:text-5xl">
            Uma credencial digital para viver a ciência de perto.
          </h2>
          <p className="mt-5 max-w-lg leading-7 text-[#D8DDF0]">
            Visitantes acessam seu QR Code, a equipe realiza check-ins e a
            gestão atualiza o portal sem editar código.
          </p>
        </div>

        <Image
          src="/images/cienciasemfundo.png"
          alt="Ciência e Tecnologia"
          width={560}
          height={405}
          className="h-auto w-52 object-contain opacity-80"
        />
      </section>

      <section className="relative flex min-h-svh items-center justify-center px-5 py-10 sm:px-8 lg:px-12">
        <div className="w-full max-w-xl">
          <Link
            href="/"
            className="mb-8 inline-flex items-center gap-2 text-sm text-blue-gray transition-colors hover:text-ice-white lg:hidden"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Voltar ao portal
          </Link>
          <p className="font-display text-xs font-semibold tracking-[.2em] text-cyan-electric uppercase">
            {eyebrow}
          </p>
          <h1 className="mt-3 font-display text-3xl font-semibold text-ice-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-lg leading-7 text-blue-gray">
            {description}
          </p>
          <div className="surface-glass mt-8 rounded-[1.75rem] p-5 sm:p-7">
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}

export { AuthFrame };
