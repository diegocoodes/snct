"use client";

/* eslint-disable @next/next/no-img-element */

import Image from "next/image";
import {
  ArrowRight,
  CalendarDays,
  CalendarRange,
  MapPin,
  TicketCheck,
} from "lucide-react";
import { motion, useReducedMotion, type Variants } from "motion/react";

import { Button } from "@/components/ui/button";
import MeshGradient from "@/components/ui/mesh-gradient";
import { heroIndicators } from "@/config/hero";

const entranceEase = [0.22, 1, 0.36, 1] as const;

const contentVariants: Variants = {
  visible: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.08,
    },
  },
};

const itemVariants: Variants = {
  visible: {
    opacity: [0, 1],
    y: [18, 0],
    transition: { duration: 0.6, ease: entranceEase },
  },
};

const particles = [
  { left: "7%", top: "20%", size: 3, delay: 0.2 },
  { left: "15%", top: "76%", size: 2, delay: 0.8 },
  { left: "39%", top: "16%", size: 2, delay: 1.3 },
  { left: "48%", top: "82%", size: 3, delay: 0.5 },
  { left: "69%", top: "13%", size: 2, delay: 1.7 },
  { left: "82%", top: "72%", size: 3, delay: 1.1 },
  { left: "93%", top: "28%", size: 2, delay: 0.4 },
] as const;

const eventFacts = [
  { label: "Paulista, Pernambuco", icon: MapPin },
  { label: "Data em breve", icon: CalendarRange },
  { label: "Evento gratuito", icon: TicketCheck },
] as const;

function AnimatedHeroBackground({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      <div className="absolute inset-0 opacity-50">
        <MeshGradient
          colors={["#10002b", "#6a00ff", "#00e5ff", "#ff2ed1"]}
          speed={reduceMotion ? 0 : 0.16}
          distortion={0.72}
          swirl={0.28}
          grainMixer={0.04}
          grainOverlay={0.025}
          scale={1.12}
          maxPixelCount={1_500_000}
          className="size-full"
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      <div className="absolute inset-0 bg-purple-deep/60" />
      <motion.div
        className="absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "radial-gradient(circle at 12% 20%, rgb(106 0 255 / 32%), transparent 34%), radial-gradient(circle at 82% 32%, rgb(255 46 209 / 18%), transparent 32%), radial-gradient(circle at 58% 88%, rgb(0 229 255 / 16%), transparent 36%)",
          backgroundSize: "120% 120%, 115% 115%, 125% 125%",
        }}
        animate={
          reduceMotion
            ? undefined
            : {
                backgroundPosition: [
                  "0% 0%, 100% 20%, 50% 100%",
                  "16% 18%, 78% 42%, 62% 76%",
                  "0% 0%, 100% 20%, 50% 100%",
                ],
              }
        }
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -top-40 -left-40 size-[34rem] rounded-full bg-purple-vibrant/25 blur-[120px]"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 70, 0], y: [0, 35, 0], scale: [1, 1.12, 1] }
        }
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute top-1/4 -right-48 size-[36rem] rounded-full bg-magenta-neon/14 blur-[130px]"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, -55, 0], y: [0, 45, 0], scale: [1, 1.16, 1] }
        }
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -bottom-56 left-[38%] size-[32rem] rounded-full bg-cyan-electric/12 blur-[120px]"
        animate={
          reduceMotion
            ? undefined
            : { x: [0, 45, 0], y: [0, -35, 0], scale: [1, 1.1, 1] }
        }
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -top-1/4 h-[150%] w-1/4 -skew-x-12 bg-gradient-to-r from-transparent via-cyan-electric/[0.07] to-transparent blur-3xl"
        animate={reduceMotion ? undefined : { x: ["-160%", "560%"] }}
        transition={{
          duration: 13,
          delay: 1.5,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      {particles.map((particle) => (
        <motion.span
          key={`${particle.left}-${particle.top}`}
          className="absolute rounded-full bg-cyan-electric/70 shadow-[0_0_12px_rgb(0_229_255/55%)]"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
          }}
          animate={
            reduceMotion
              ? undefined
              : { opacity: [0.2, 0.75, 0.2], y: [0, -10, 0] }
          }
          transition={{
            duration: 4.5,
            delay: particle.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
}

function HeroSection({
  eventEdition = "Paulista 2026",
  heroImageUrl = "/images/cienciasemfundo.png",
}: {
  eventEdition?: string;
  heroImageUrl?: string;
}) {
  const shouldReduceMotion = useReducedMotion() ?? false;

  return (
    <section
      id="inicio"
      aria-labelledby="hero-title"
      className="circuit-grid relative isolate overflow-hidden px-5 pt-32 pb-16 sm:px-8 sm:pt-36 sm:pb-20 lg:pt-40 lg:pb-24"
    >
      <AnimatedHeroBackground reduceMotion={shouldReduceMotion} />

      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.12fr_.88fr] lg:items-center lg:gap-10 xl:gap-16">
        <motion.div
          variants={contentVariants}
          initial={false}
          animate={shouldReduceMotion ? undefined : "visible"}
          className="relative z-10 min-w-0"
        >
          <div className="relative">
            <div
              aria-hidden="true"
              className="absolute top-1/2 left-1/3 -z-10 h-32 w-4/5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-vibrant/18 blur-[70px]"
            />
            <h1 id="hero-title" className="font-display text-ice-white">
              <motion.span
                variants={itemVariants}
                className="block text-lg font-medium tracking-[.08em] text-blue-gray sm:text-xl lg:text-2xl"
              >
                Semana Nacional de
              </motion.span>
              <motion.span
                variants={itemVariants}
                className="mt-2 block bg-gradient-to-r from-cyan-electric via-purple-vibrant to-magenta-neon bg-clip-text text-5xl leading-[1.02] font-bold tracking-[-.045em] text-transparent sm:text-6xl lg:text-7xl xl:text-[5.2rem]"
              >
                Ciência e Tecnologia
              </motion.span>
              <motion.span
                variants={itemVariants}
                className="mt-3 block text-2xl font-semibold tracking-[.06em] text-ice-white sm:text-3xl"
              >
                {eventEdition}
              </motion.span>
            </h1>
          </div>

          <motion.div
            variants={itemVariants}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <Button
              size="lg"
              className="w-full sm:w-auto"
              render={
                <a href="/cadastro" aria-label="Fazer inscrição gratuita" />
              }
            >
              Fazer inscrição gratuita
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Button>
            <Button
              size="lg"
              variant="glow"
              className="w-full sm:w-auto"
              render={<a href="/programacao" aria-label="Ver programação" />}
            >
              <CalendarDays data-icon="inline-start" aria-hidden />
              Ver programação
            </Button>
          </motion.div>

          <motion.ul
            variants={itemVariants}
            aria-label="Informações do evento"
            className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-medium text-[#D8DDF0]"
          >
            {eventFacts.map(({ label, icon: Icon }) => (
              <li key={label} className="flex items-center gap-2">
                <Icon
                  className="size-4 shrink-0 text-cyan-electric"
                  aria-hidden
                />
                <span>{label}</span>
              </li>
            ))}
          </motion.ul>

          <motion.dl
            variants={contentVariants}
            className="mt-8 grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-3"
          >
            {heroIndicators.map((indicator) => (
              <motion.div
                key={`${indicator.value}-${indicator.label}`}
                variants={itemVariants}
                className="flex min-w-0 flex-col rounded-xl border border-white/10 bg-white/[0.045] px-4 py-3 backdrop-blur-sm last:col-span-2 sm:last:col-span-1"
              >
                <dt className="order-2 text-xs leading-5 text-blue-gray">
                  {indicator.label}
                </dt>
                <dd className="order-1 break-words font-display text-lg font-semibold text-ice-white">
                  {indicator.value}
                </dd>
              </motion.div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div
          initial={false}
          animate={
            shouldReduceMotion
              ? undefined
              : {
                  opacity: [0, 1],
                  x: [24, 0],
                  scale: [0.97, 1],
                  y: [0, -7, 0],
                }
          }
          transition={
            shouldReduceMotion
              ? { duration: 0 }
              : {
                  opacity: { duration: 0.7, ease: entranceEase },
                  x: { duration: 0.7, ease: entranceEase },
                  scale: { duration: 0.7, ease: entranceEase },
                  y: {
                    duration: 6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.8,
                  },
                }
          }
          className="relative z-10 mx-auto min-h-[22rem] w-full max-w-xl sm:min-h-[26rem] lg:min-h-[30rem]"
        >
          <div
            aria-hidden="true"
            className="absolute inset-[14%] rounded-full bg-[radial-gradient(circle,rgb(106_0_255/30%),rgb(255_46_209/10%)_42%,transparent_70%)] blur-2xl"
          />
          <motion.div
            aria-hidden="true"
            className="absolute inset-[9%] rounded-full border border-cyan-electric/25"
            animate={shouldReduceMotion ? undefined : { rotate: 360 }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute top-[17%] -right-1 size-2.5 rounded-full bg-cyan-electric shadow-[0_0_15px_rgb(0_229_255/85%)]" />
          </motion.div>
          <motion.div
            aria-hidden="true"
            className="absolute inset-[22%] rounded-full border border-magenta-neon/30"
            animate={shouldReduceMotion ? undefined : { rotate: -360 }}
            transition={{ duration: 17, repeat: Infinity, ease: "linear" }}
          >
            <span className="absolute bottom-[10%] left-[8%] size-2 rounded-full bg-magenta-neon shadow-[0_0_14px_rgb(255_46_209/85%)]" />
          </motion.div>
          <div className="absolute inset-0 grid place-items-center p-4">
            <motion.div
              animate={shouldReduceMotion ? undefined : { y: [0, -5, 0] }}
              transition={{
                duration: 4.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative z-10 w-[94%] max-w-[26rem]"
            >
              {heroImageUrl.startsWith("/") ? (
                <Image
                  src={heroImageUrl}
                  alt={`Símbolo Ciência e Tecnologia da SNCT ${eventEdition}`}
                  width={560}
                  height={405}
                  className="h-auto w-full object-contain drop-shadow-[0_0_34px_rgb(0_229_255/24%)]"
                  preload
                />
              ) : (
                <img
                  src={heroImageUrl}
                  alt={`Símbolo Ciência e Tecnologia da SNCT ${eventEdition}`}
                  className="h-auto w-full object-contain drop-shadow-[0_0_34px_rgb(0_229_255/24%)]"
                />
              )}
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export { HeroSection };
