import { CalendarDays, Clock3, MapPin } from "lucide-react";

import { EventFooter } from "@/components/event/event-footer";
import { EventHeader } from "@/components/event/event-header";
import { InternalPageHero } from "@/components/event/internal-page-hero";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import { readPublicSnctStore } from "@/lib/snct-store";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  const store = await readPublicSnctStore();

  return (
    <>
      <EventHeader />
      <main>
        <InternalPageHero
          eyebrow="Programação"
          title="Experiências para aprender, criar e compartilhar"
          description="Consulte as atividades previstas. Horários, espaços e novas experiências podem ser atualizados pela organização do evento."
        />
        <section
          aria-labelledby="agenda-title"
          className="px-5 py-20 sm:px-8 sm:py-24"
        >
          <div className="mx-auto max-w-5xl">
            <h2
              id="agenda-title"
              className="font-display text-3xl font-semibold text-ice-white"
            >
              Agenda do evento
            </h2>
            {store.events.length ? (
              <ol className="relative mt-10 space-y-4 before:absolute before:top-6 before:bottom-6 before:left-[1.15rem] before:w-px before:bg-gradient-to-b before:from-cyan-electric before:via-purple-vibrant before:to-magenta-neon sm:before:left-[8.2rem]">
                {store.events.map((event) => (
                  <li
                    key={event.id}
                    className="relative grid gap-3 pl-12 sm:grid-cols-[7rem_1fr] sm:gap-8 sm:pl-0"
                  >
                    <span
                      aria-hidden
                      className="absolute top-6 left-[.9rem] z-10 size-2.5 rounded-full bg-cyan-electric shadow-[0_0_14px_rgb(0_229_255/70%)] sm:left-[7.95rem]"
                    />
                    <div className="flex gap-3 text-sm font-semibold text-[#9AB7C8] sm:flex-col sm:gap-1 sm:pt-5 sm:text-right">
                      <span className="inline-flex items-center gap-1.5 sm:justify-end">
                        <CalendarDays
                          className="size-4 text-cyan-electric"
                          aria-hidden
                        />
                        {event.date}
                      </span>
                      <span className="inline-flex items-center gap-1.5 sm:justify-end">
                        <Clock3
                          className="size-4 text-purple-vibrant"
                          aria-hidden
                        />
                        {event.time}
                      </span>
                    </div>
                    <Card className="border-cyan-electric/12 bg-white/[0.025]">
                      <CardContent>
                        <h3 className="font-display text-lg font-semibold text-ice-white">
                          {event.title}
                        </h3>
                        <p className="mt-2 flex items-center gap-2 text-sm text-blue-gray">
                          <MapPin
                            className="size-4 text-magenta-neon"
                            aria-hidden
                          />
                          {event.location}
                        </p>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ol>
            ) : (
              <EmptyState
                className="mt-10"
                title="Programação em construção"
                description="Palestras, oficinas, painéis e exposições serão publicados aqui assim que forem confirmados pela organização."
              />
            )}
          </div>
        </section>
      </main>
      <EventFooter />
    </>
  );
}
