import { Accessibility, ExternalLink, MapPin, Navigation } from "lucide-react";

import { EventFooter } from "@/components/event/event-footer";
import { EventHeader } from "@/components/event/event-header";
import { HeroSection } from "@/components/event/hero-section";
import { HighlightsSection } from "@/components/event/highlights-section";
import { NewsCarousel } from "@/components/event/news-carousel";
import { PartnersMarquee } from "@/components/event/partners-marquee";
import { Button } from "@/components/ui/button";
import { getPaulistaNews } from "@/lib/paulista-news";
import { readPublicSnctStore } from "@/lib/snct-store";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [store, newsItems] = await Promise.all([
    readPublicSnctStore(),
    getPaulistaNews(),
  ]);

  return (
    <>
      <EventHeader />
      <main>
        <HeroSection
          eventEdition={store.settings.eventEdition}
          heroImageUrl={store.settings.heroImageUrl}
        />

        <NewsCarousel newsItems={newsItems} />

        <HighlightsSection events={store.events} notices={store.notices} />

        <section
          id="localizacao"
          aria-labelledby="location-title"
          className="relative isolate overflow-hidden px-5 py-20 sm:px-8 sm:py-24"
        >
          <div
            aria-hidden="true"
            className="circuit-grid pointer-events-none absolute inset-0 -z-20 opacity-35"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-[12%] -z-10 size-[24rem] -translate-y-1/2 rounded-full bg-purple-vibrant/16 blur-[120px]"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute right-[5%] bottom-0 -z-10 size-[20rem] rounded-full bg-cyan-electric/8 blur-[110px]"
          />

          <div className="surface-glass mx-auto grid max-w-7xl overflow-hidden rounded-[1.75rem] p-1 sm:rounded-[2rem] lg:grid-cols-[.78fr_1.22fr]">
            <div className="relative flex flex-col justify-center px-5 py-9 sm:px-9 sm:py-12 lg:px-12">
              <span
                aria-hidden="true"
                className="absolute top-0 left-10 h-px w-28 bg-gradient-to-r from-cyan-electric to-transparent"
              />
              <p className="flex items-center gap-2 font-display text-xs font-semibold tracking-[.2em] text-cyan-electric uppercase sm:text-sm">
                <MapPin className="size-4" aria-hidden /> Localização
              </p>
              <h2
                id="location-title"
                className="mt-4 text-balance font-display text-3xl leading-tight font-semibold text-ice-white sm:text-4xl"
              >
                Encontre a SNCT em{" "}
                <span className="bg-gradient-to-r from-cyan-electric via-[#A78BFA] to-magenta-neon bg-clip-text text-transparent">
                  Paulista
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-sm leading-7 text-[#D8DDF0] sm:text-base">
                Consulte a região do evento e planeje seu deslocamento. O ponto
                exato será divulgado com a programação oficial.
              </p>

              <dl className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                  <dt className="text-xs text-blue-gray">Município</dt>
                  <dd className="mt-1 font-display text-sm font-semibold text-ice-white">
                    Paulista, Pernambuco
                  </dd>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.035] px-4 py-3">
                  <dt className="text-xs text-blue-gray">CEP da região</dt>
                  <dd className="mt-1 font-display text-sm font-semibold text-ice-white">
                    53401-445
                  </dd>
                </div>
              </dl>

              <p className="mt-5 flex items-start gap-2 text-xs leading-5 text-blue-gray">
                <Accessibility
                  className="mt-0.5 size-4 shrink-0 text-magenta-neon"
                  aria-hidden
                />
                Orientações de acesso e acessibilidade serão atualizadas pela
                organização.
              </p>

              <Button
                variant="glow"
                size="lg"
                className="mt-7 w-full sm:w-fit"
                render={
                  <a
                    href="https://www.google.com/maps/search/53401-445,+Paulista,+PE"
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Abrir localização no Google Maps em uma nova aba"
                  />
                }
              >
                <Navigation data-icon="inline-start" aria-hidden />
                Traçar rota
                <ExternalLink data-icon="inline-end" aria-hidden />
              </Button>
            </div>

            <div className="relative min-h-[22rem] overflow-hidden rounded-[1.5rem] border border-cyan-electric/15 bg-purple-dark sm:min-h-[28rem] lg:rounded-[1.7rem]">
              <iframe
                title="Mapa da região da SNCT em Paulista, Pernambuco"
                src="https://www.google.com/maps?q=53401-445%2C+Paulista%2C+PE&output=embed"
                className="absolute inset-0 h-full w-full border-0 grayscale-[15%] contrast-[1.05]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgb(0_229_255/10%),inset_0_0_60px_rgb(16_0_43/22%)]"
              />
              <div className="pointer-events-none absolute top-4 left-4 flex items-center gap-2 rounded-full border border-cyan-electric/20 bg-purple-deep/85 px-3 py-2 text-xs font-semibold text-ice-white shadow-lg backdrop-blur-md">
                <span className="size-2 rounded-full bg-cyan-electric shadow-[0_0_10px_rgb(0_229_255/80%)] motion-safe:animate-pulse" />
                Mapa interativo
              </div>
            </div>
          </div>
        </section>

        <PartnersMarquee partners={store.partners} />
      </main>
      <EventFooter />
    </>
  );
}
