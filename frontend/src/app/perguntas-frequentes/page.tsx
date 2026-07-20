import { EventFooter } from "@/components/event/event-footer";
import { EventHeader } from "@/components/event/event-header";
import { FAQSection } from "@/components/event/faq-section";
import { InternalPageHero } from "@/components/event/internal-page-hero";

export default function FrequentlyAskedQuestionsPage() {
  return (
    <>
      <EventHeader />
      <main>
        <InternalPageHero
          eyebrow="Perguntas frequentes"
          title="Informação clara para participar com tranquilidade"
          description="Encontre respostas sobre inscrição, credencial digital, QR Code, check-in e acessibilidade do evento."
        />
        <FAQSection showIntro={false} />
      </main>
      <EventFooter />
    </>
  );
}
