import { Download, FileText } from "lucide-react";

import { EventFooter } from "@/components/event/event-footer";
import { EventHeader } from "@/components/event/event-header";
import { InternalPageHero } from "@/components/event/internal-page-hero";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state-panel";
import { readPublicSnctStore } from "@/lib/snct-store";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NoticesPage() {
  const store = await readPublicSnctStore();

  return (
    <>
      <EventHeader />
      <main>
        <InternalPageHero
          eyebrow="Documentos oficiais"
          title="Editais e inscrições"
          description="Consulte os editais publicados pela organização, acompanhe os prazos e acesse os documentos anexos."
        />
        <section
          aria-labelledby="notices-list-title"
          className="px-5 py-20 sm:px-8 sm:py-24"
        >
          <div className="mx-auto max-w-5xl">
            <h2
              id="notices-list-title"
              className="font-display text-3xl font-semibold text-ice-white"
            >
              Editais publicados
            </h2>

            {store.notices.length ? (
              <div className="mt-10 grid gap-4">
                {store.notices.map((notice) => (
                  <Card
                    key={notice.id}
                    className="border-cyan-electric/12 bg-white/[0.025]"
                  >
                    <CardContent>
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="font-display text-lg font-semibold leading-7 text-ice-white">
                            {notice.title}
                          </h3>
                          <p className="mt-1 text-sm text-blue-gray">
                            Inscrições: {notice.registration}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "h-6 shrink-0 px-2.5 capitalize",
                            notice.status === "aberto"
                              ? "border-emerald-400/25 bg-emerald-400/15 text-emerald-300"
                              : "border-white/10 bg-white/10 text-blue-gray",
                          )}
                        >
                          {notice.status}
                        </Badge>
                      </div>

                      {notice.documents.length ? (
                        <ul className="mt-5 grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-2">
                          {notice.documents.map((document) => (
                            <li key={document.id}>
                              <a
                                href={`/api/documents/${document.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex min-w-0 items-center gap-3 rounded-xl border border-white/10 bg-white/[0.025] p-3 transition-colors hover:border-cyan-electric/30 hover:bg-cyan-electric/[0.05] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-electric"
                              >
                                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-cyan-electric/10 text-cyan-electric">
                                  <FileText className="size-4" aria-hidden />
                                </span>
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-semibold text-ice-white">
                                    {document.name}
                                  </span>
                                  <span className="text-xs text-blue-gray">
                                    {(document.size / 1024 / 1024).toFixed(2)}{" "}
                                    MB
                                  </span>
                                </span>
                                <Download
                                  className="size-4 shrink-0 text-cyan-electric"
                                  aria-hidden
                                />
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-5 border-t border-white/10 pt-4 text-sm text-blue-gray">
                          Nenhum documento anexado a este edital.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState
                className="mt-10"
                title="Nenhum edital publicado"
                description="Os editais aparecerão aqui assim que forem publicados pela organização."
              />
            )}
          </div>
        </section>
      </main>
      <EventFooter />
    </>
  );
}
