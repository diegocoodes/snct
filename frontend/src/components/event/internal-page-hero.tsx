import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function InternalPageHero({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="circuit-grid relative isolate overflow-hidden border-b border-white/10 px-5 pt-32 pb-16 sm:px-8 sm:pt-36 sm:pb-20">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_20%,rgb(106_0_255/30%),transparent_34%),radial-gradient(circle_at_82%_42%,rgb(255_46_209/14%),transparent_30%),radial-gradient(circle_at_52%_100%,rgb(0_229_255/10%),transparent_34%)]"
      />
      <div className="mx-auto max-w-7xl">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-cyan-electric transition-colors hover:text-ice-white focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-cyan-electric"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Voltar ao início
        </Link>
        <p className="mt-9 font-display text-sm font-semibold tracking-[.22em] text-cyan-electric uppercase">
          {eyebrow}
        </p>
        <h1 className="mt-3 max-w-4xl bg-gradient-to-r from-ice-white via-cyan-electric to-magenta-neon bg-clip-text font-display text-4xl leading-tight font-semibold text-transparent sm:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-[#D8DDF0] sm:text-lg">
          {description}
        </p>
      </div>
    </section>
  );
}

export { InternalPageHero };
