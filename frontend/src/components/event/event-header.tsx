"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChevronRight,
  CircleHelp,
  FileText,
  Home,
  Info,
  LogIn,
  MapPinned,
  Menu,
  Newspaper,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const navigation = [
  { label: "Início", href: "/", icon: Home },
  { label: "Notícias", href: "/#noticias", icon: Newspaper },
  { label: "Editais", href: "/editais", icon: FileText },
  { label: "Sobre", href: "/sobre", icon: Info },
  { label: "Programação", href: "/programacao", icon: CalendarDays },
  { label: "Localização", href: "/#localizacao", icon: MapPinned },
  {
    label: "Perguntas frequentes",
    href: "/perguntas-frequentes",
    icon: CircleHelp,
  },
] as const;

function isActiveRoute(pathname: string, href: string) {
  if (href.includes("#")) return false;
  return pathname === href;
}

function EventHeader() {
  const pathname = usePathname();

  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-cyan-electric/10 bg-purple-deep/78 shadow-[0_10px_40px_rgb(3_0_20/24%)] backdrop-blur-xl">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-cyan-electric/35 to-transparent"
      />
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link
          href="/"
          className="relative flex h-16 items-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-electric"
          aria-label="SNCT Paulista 2026 — início"
        >
          <span
            aria-hidden="true"
            className="absolute inset-2 -z-10 rounded-full bg-purple-vibrant/20 blur-xl"
          />
          <Image
            src="/images/cienciasemfundo.png"
            alt="Ciência e Tecnologia"
            width={560}
            height={405}
            className="h-12 w-auto object-contain sm:h-14"
            priority
          />
        </Link>

        <nav
          aria-label="Navegação principal"
          className="hidden items-center gap-5 lg:flex xl:gap-6"
        >
          {navigation.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActiveRoute(pathname, href) ? "page" : undefined}
              className={cn(
                "relative py-2 text-sm text-muted-foreground transition-colors after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:scale-x-0 after:bg-cyan-electric after:transition-transform hover:text-foreground hover:after:scale-x-100",
                isActiveRoute(pathname, href) &&
                  "text-ice-white after:scale-x-100",
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <Button
            variant="glow"
            render={<Link href="/credencial" />}
          >
            Credencial
          </Button>
          <Button variant="ghost" render={<Link href="/login" />}>
            <LogIn aria-hidden /> Entrar
          </Button>
          <Button render={<Link href="/auth/inscricao" />}>Inscreva-se</Button>
        </div>

        <Sheet>
          <SheetTrigger
            render={
              <Button
                variant="outline"
                size="icon"
                className="relative border-cyan-electric/25 bg-cyan-electric/[0.06] text-cyan-electric shadow-[0_0_22px_rgb(0_229_255/8%)] hover:bg-cyan-electric/12 lg:hidden"
                aria-label="Abrir menu de navegação"
              />
            }
          >
            <Menu className="size-5" aria-hidden />
          </SheetTrigger>

          <SheetContent
            side="right"
            className="w-[min(23rem,90vw)]! overflow-hidden border-l border-cyan-electric/20 bg-[radial-gradient(circle_at_90%_4%,rgb(0_229_255/12%),transparent_25%),radial-gradient(circle_at_12%_82%,rgb(255_46_209/10%),transparent_28%),#10002b] p-0 shadow-[-24px_0_70px_rgb(3_0_20/48%)]"
          >
            <div
              aria-hidden="true"
              className="circuit-grid pointer-events-none absolute inset-0 opacity-25"
            />
            <div
              aria-hidden="true"
              className="absolute top-0 left-0 h-px w-full bg-gradient-to-r from-cyan-electric via-purple-vibrant to-magenta-neon"
            />

            <SheetHeader className="relative border-b border-white/10 px-5 pt-7 pb-5">
              <div className="flex items-center gap-3 pr-10">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-cyan-electric/20 bg-cyan-electric/[0.07]">
                  <Image
                    src="/images/cienciasemfundo.png"
                    alt=""
                    width={560}
                    height={405}
                    className="h-9 w-auto object-contain"
                  />
                </span>
                <div>
                  <SheetTitle className="font-display text-base font-semibold text-ice-white">
                    SNCT Paulista 2026
                  </SheetTitle>
                  <SheetDescription className="mt-1 text-xs text-blue-gray">
                    Ciência, tecnologia e inovação
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <nav
              aria-label="Navegação móvel"
              className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-5"
            >
              <p className="mb-2 px-3 text-[0.68rem] font-semibold tracking-[.2em] text-cyan-electric uppercase">
                Explorar o portal
              </p>
              {navigation.map(({ label, href, icon: Icon }) => {
                const active = isActiveRoute(pathname, href);
                return (
                  <SheetClose
                    key={href}
                    render={
                      <Link
                        href={href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "group flex min-h-12 items-center gap-3 rounded-xl border border-transparent px-3 py-2.5 text-sm font-medium text-blue-gray transition-all hover:border-cyan-electric/15 hover:bg-white/[0.045] hover:text-ice-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-electric",
                          active &&
                            "border-cyan-electric/20 bg-gradient-to-r from-cyan-electric/10 to-purple-vibrant/10 text-ice-white",
                        )}
                      />
                    }
                  >
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-lg bg-white/[0.045] text-cyan-electric transition-colors group-hover:bg-cyan-electric/10",
                        active && "bg-cyan-electric/12",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="flex-1">{label}</span>
                    <ChevronRight
                      className="size-4 text-blue-gray/55 transition-transform group-hover:translate-x-0.5 group-hover:text-cyan-electric motion-reduce:transition-none"
                      aria-hidden
                    />
                  </SheetClose>
                );
              })}
            </nav>

            <SheetFooter className="relative border-t border-white/10 bg-black/10 p-4">
              <SheetClose
                render={
                  <Link
                    href="/credencial"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl border border-cyan-electric/30 bg-cyan-electric/10 px-4 text-sm font-semibold text-cyan-electric shadow-[0_0_24px_rgb(0_229_255/12%)] hover:bg-cyan-electric/18 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-electric"
                  />
                }
              >
                Credencial
              </SheetClose>
              <SheetClose
                render={
                  <Link
                    href="/auth/inscricao"
                    className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-vibrant to-[#8B20FF] px-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgb(106_0_255/28%)] transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-electric motion-reduce:transition-none"
                  />
                }
              >
                <Sparkles className="size-4" aria-hidden /> Criar credencial
              </SheetClose>
              <SheetClose
                render={
                  <Link
                    href="/login"
                    className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-cyan-electric/20 bg-cyan-electric/[0.05] px-4 text-sm font-semibold text-cyan-electric hover:bg-cyan-electric/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-electric"
                  />
                }
              >
                <LogIn className="size-4" aria-hidden /> Entrar na área do
                evento
              </SheetClose>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}

export { EventHeader };
