"use client";

import Image from "next/image";
import { ArrowUpRight, CalendarDays, Newspaper } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { EmptyState } from "@/components/ui/state-panel";
import type { NewsItem } from "@/config/news";

function NewsCarousel({ newsItems }: { newsItems: readonly NewsItem[] }) {
  return (
    <section
      id="noticias"
      aria-labelledby="noticias-title"
      className="border-y border-border bg-white/[0.018] px-5 py-20 sm:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex items-end justify-between gap-6">
          <div className="max-w-2xl">
            <p className="font-display text-sm tracking-[.22em] text-cyan-electric uppercase">
              Fique por dentro
            </p>
            <h2
              id="noticias-title"
              className="mt-3 font-display text-3xl font-semibold sm:text-4xl"
            >
              Últimas notícias
            </h2>
            <p className="mt-4 leading-7 text-muted-foreground">
              Notícias publicadas pela Prefeitura do Paulista, atualizadas
              diretamente do portal oficial.
            </p>
          </div>
          <a
            href="https://paulista.pe.gov.br/noticias/"
            target="_blank"
            rel="noreferrer"
            className="hidden shrink-0 items-center gap-1.5 text-sm font-semibold text-cyan-electric underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-electric sm:flex"
          >
            Todas as notícias <ArrowUpRight className="size-4" aria-hidden />
          </a>
        </div>

        {newsItems.length ? (
          <Carousel
            aria-label="Notícias da Prefeitura do Paulista"
            opts={{ align: "start" }}
            className="mt-10"
          >
            <div className="mb-5 flex justify-end gap-2">
              <CarouselPrevious className="static inset-auto my-0 translate-y-0" />
              <CarouselNext className="static inset-auto my-0 translate-y-0" />
            </div>
            <CarouselContent>
              {newsItems.map((item) => (
                <CarouselItem
                  key={item.id}
                  className="md:basis-1/2 lg:basis-1/3"
                >
                  <Card className="h-full overflow-hidden pt-0">
                    {item.imageUrl ? (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="relative block aspect-[16/9] overflow-hidden bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-cyan-electric"
                        aria-label={`Abrir notícia: ${item.title}`}
                      >
                        <Image
                          src={item.imageUrl}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 hover:scale-[1.03] motion-reduce:transition-none"
                        />
                      </a>
                    ) : null}
                    <CardHeader>
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <Badge
                          variant="outline"
                          className="h-auto max-w-[62%] border-cyan-electric/25 bg-cyan-electric/8 py-1 whitespace-normal text-cyan-electric"
                        >
                          <Newspaper data-icon="inline-start" />
                          {item.category}
                        </Badge>
                        <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                          <CalendarDays className="size-3.5" aria-hidden />
                          {item.date}
                        </span>
                      </div>
                      <CardTitle className="text-lg leading-7">
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          className="underline-offset-4 hover:text-cyan-electric hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-electric"
                        >
                          {item.title}
                        </a>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col leading-6 text-muted-foreground">
                      <p className="line-clamp-4">{item.excerpt}</p>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-5 inline-flex items-center gap-1.5 self-start text-sm font-semibold text-cyan-electric underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-electric"
                      >
                        Ler no portal oficial
                        <ArrowUpRight className="size-4" aria-hidden />
                      </a>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        ) : (
          <EmptyState
            className="mt-10"
            title="Notícias temporariamente indisponíveis"
            description="O portal oficial da Prefeitura do Paulista não respondeu. Tente novamente em alguns instantes."
          />
        )}
      </div>
    </section>
  );
}

export { NewsCarousel };
