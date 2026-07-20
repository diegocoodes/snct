/* eslint-disable @next/next/no-img-element */

import { partners as defaultPartners, type Partner } from "@/config/partners";

function PartnerList({
  partners,
  duplicate = false,
}: {
  partners: readonly Partner[];
  duplicate?: boolean;
}) {
  return (
    <ul
      aria-hidden={duplicate || undefined}
      className="flex shrink-0 items-center gap-4 pr-4 sm:gap-5 sm:pr-5"
    >
      {partners.map((partner) => (
        <li
          key={`${duplicate ? "duplicate-" : ""}${partner.id ?? partner.logo}`}
          className="relative flex h-24 w-48 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0f1022]/90 shadow-[0_12px_36px_rgb(0_0_0/18%)] sm:h-28 sm:w-56"
        >
          <img
            src={partner.logo}
            alt={duplicate ? "" : partner.name}
            loading={duplicate ? "lazy" : "eager"}
            className="size-full object-contain p-4 sm:p-5"
          />
        </li>
      ))}
    </ul>
  );
}

function PartnersMarquee({
  partners = defaultPartners,
}: {
  partners?: readonly Partner[];
}) {
  return (
    <section
      id="parceiros"
      aria-labelledby="parceiros-title"
      className="border-y border-border bg-white/[0.018] py-20"
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="font-display text-sm tracking-[.22em] text-cyan-electric uppercase">
          Juntos pela transformação
        </p>
        <h2
          id="parceiros-title"
          className="mt-3 font-display text-3xl font-semibold text-ice-white sm:text-4xl"
        >
          Parceiros institucionais
        </h2>
        <p className="mt-4 max-w-2xl leading-7 text-[#D8DDF0]">
          Instituições que fortalecem a ciência, a educação e a inovação em
          Paulista.
        </p>
      </div>

      <div
        className="relative mt-10 overflow-hidden motion-reduce:hidden"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 7%, black 93%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 7%, black 93%, transparent)",
        }}
      >
        <div className="partner-marquee-track flex w-max will-change-transform">
          <PartnerList partners={partners} />
          <PartnerList partners={partners} duplicate />
        </div>
      </div>

      <ul className="mx-auto mt-10 hidden max-w-7xl grid-cols-2 gap-3 px-5 motion-reduce:grid sm:grid-cols-3 sm:px-8 lg:grid-cols-4">
        {partners.map((partner) => (
          <li
            key={`static-${partner.id ?? partner.logo}`}
            className="relative flex h-24 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#0f1022]/90"
          >
            <img
              src={partner.logo}
              alt={partner.name}
              loading="lazy"
              className="size-full object-contain p-3 sm:p-4"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

export { PartnersMarquee };
