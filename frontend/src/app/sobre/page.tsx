import {
  Atom,
  BriefcaseBusiness,
  Cpu,
  GraduationCap,
  Lightbulb,
  Network,
} from "lucide-react";

import { EventFooter } from "@/components/event/event-footer";
import { EventHeader } from "@/components/event/event-header";
import { InternalPageHero } from "@/components/event/internal-page-hero";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    title: "Ciência",
    icon: Atom,
    text: "Descobertas que aproximam conhecimento e sociedade.",
  },
  {
    title: "Tecnologia",
    icon: Cpu,
    text: "Soluções digitais para desafios reais da comunidade.",
  },
  {
    title: "Inovação",
    icon: Lightbulb,
    text: "Ideias transformadas em impacto econômico e social.",
  },
  {
    title: "Educação",
    icon: GraduationCap,
    text: "Aprendizagem ativa para todas as idades.",
  },
  {
    title: "Empreendedorismo",
    icon: BriefcaseBusiness,
    text: "Conexões para novos projetos e oportunidades.",
  },
  {
    title: "Inclusão digital",
    icon: Network,
    text: "Tecnologia acessível, diversa e responsável.",
  },
] as const;

export default function AboutPage() {
  return (
    <>
      <EventHeader />
      <main>
        <InternalPageHero
          eyebrow="Sobre o evento"
          title="Conhecimento perto de quem transforma a cidade"
          description="Um encontro para aproximar educação, pesquisa, inovação e desenvolvimento, fortalecendo a participação de estudantes, profissionais, instituições e de toda a comunidade."
        />
        <section
          aria-labelledby="pilares-title"
          className="px-5 py-20 sm:px-8 sm:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <h2
              id="pilares-title"
              className="font-display text-3xl font-semibold text-ice-white sm:text-4xl"
            >
              Pilares que orientam a SNCT
            </h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pillars.map(({ title, text, icon: Icon }) => (
                <Card key={title} className="border-purple-vibrant/15">
                  <CardHeader>
                    <span className="mb-3 grid size-11 place-items-center rounded-xl bg-gradient-to-br from-cyan-electric/15 to-purple-vibrant/20 text-cyan-electric">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <CardTitle>{title}</CardTitle>
                  </CardHeader>
                  <CardContent className="leading-6 text-muted-foreground">
                    {text}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <EventFooter />
    </>
  );
}
