"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { Play, RotateCcw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

import { RankingThreeCrown } from "@/components/ranking/ranking-three-crown";

const winners = [
  {
    place: 3,
    stand: "Stand 18",
    project: "Horta Inteligente",
    school: "Escola Municipal João Barros",
    score: "92,4",
  },
  {
    place: 2,
    stand: "Stand 07",
    project: "Energia que Transforma",
    school: "Escola Técnica Estadual José Alencar",
    score: "95,8",
  },
  {
    place: 1,
    stand: "Stand 24",
    project: "Mangue Vivo",
    school: "Escola Municipal Gelda Amorim",
    score: "98,7",
  },
];

const confettiColors = ["#ffe16a", "#ff4fd8", "#39ecff", "#8b5cff", "#ffffff"];

export function RankingCeremony() {
  const reduceMotion = useReducedMotion();
  const [revealed, setRevealed] = useState(0);
  const [run, setRun] = useState(0);
  const [phase, setPhase] = useState<"idle" | "transition" | "countdown" | "final">("idle");
  const [countdown, setCountdown] = useState<number | null>(null);

  const confetti = useMemo(
    () =>
      Array.from({ length: 70 }, (_, index) => ({
        id: index,
        left: `${(index * 37) % 101}%`,
        delay: `${(index % 14) * 0.09}s`,
        duration: `${2.6 + (index % 8) * 0.18}s`,
        color: confettiColors[index % confettiColors.length],
        rotate: `${(index * 47) % 180}deg`,
      })),
    [],
  );

  const scienceParticles = useMemo(
    () => Array.from({ length: 24 }, (_, index) => ({
      id: index,
      symbol: ["✦", "⚛", "⌁", "·"][index % 4],
      left: `${5 + ((index * 41) % 91)}%`,
      top: `${18 + ((index * 29) % 70)}%`,
      delay: `${(index % 8) * 0.16}s`,
    })),
    [],
  );

  useEffect(() => {
    if (phase !== "transition") return;
    const timer = window.setTimeout(() => setPhase("idle"), reduceMotion ? 20 : 950);
    return () => window.clearTimeout(timer);
  }, [phase, reduceMotion]);

  useEffect(() => {
    if (countdown === null) return;
    const timer = window.setTimeout(() => {
      if (countdown > 1) {
        setCountdown((value) => (value ?? 1) - 1);
        return;
      }
      setCountdown(null);
      setRevealed(3);
      setRun((value) => value + 1);
      setPhase("final");
    }, reduceMotion ? 20 : 850);
    return () => window.clearTimeout(timer);
  }, [countdown, reduceMotion]);

  useEffect(() => {
    if (phase !== "final") return;
    const timer = window.setTimeout(() => setPhase("idle"), reduceMotion ? 20 : 1800);
    return () => window.clearTimeout(timer);
  }, [phase, reduceMotion]);

  function advanceCeremony() {
    if (phase !== "idle") return;
    if (revealed === 3) {
      setRevealed(0);
      setRun((value) => value + 1);
      return;
    }
    if (revealed === 2) {
      setPhase("countdown");
      setCountdown(3);
      return;
    }
    const nextPosition = revealed + 1;
    setPhase("transition");
    setRevealed(nextPosition);
  }

  const buttonLabel =
    revealed === 0
      ? "Revelar 3º lugar"
      : revealed === 1
        ? "Revelar 2º lugar"
        : revealed === 2
          ? "Revelar 1º lugar"
          : "Reiniciar premiação";

  const busy = phase !== "idle";

  return (
    <main className="relative isolate min-h-screen overflow-hidden bg-[#070313] text-white">
      <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_50%_-10%,#7024b9_0%,#1a0937_32%,#070313_68%)]" />
      <div className="ranking-grid absolute inset-0 -z-10 opacity-25" />
      <div className="absolute left-1/2 top-[-15rem] -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-fuchsia-500/15 blur-[100px]" />
      <div className="absolute left-[8%] top-0 -z-10 h-[72%] w-72 origin-top -rotate-12 bg-gradient-to-b from-cyan-300/[0.08] to-transparent blur-2xl [clip-path:polygon(42%_0,58%_0,100%_100%,0_100%)]" />
      <div className="absolute right-[8%] top-0 -z-10 h-[72%] w-72 origin-top rotate-12 bg-gradient-to-b from-fuchsia-400/[0.09] to-transparent blur-2xl [clip-path:polygon(42%_0,58%_0,100%_100%,0_100%)]" />

      <AnimatePresence>
        {phase === "transition" ? (
          <motion.div
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            aria-hidden
          >
            <motion.div
              className="absolute -top-1/4 h-[150%] w-44 bg-gradient-to-r from-transparent via-cyan-200/35 to-transparent blur-xl"
              initial={{ left: "-25%", rotate: -12 }}
              animate={{ left: "115%" }}
              transition={{ duration: 0.85, ease: "easeInOut" }}
            />
          </motion.div>
        ) : null}
        {phase === "countdown" && countdown ? (
          <motion.div
            className="fixed inset-0 z-50 grid place-items-center bg-[#05010d]/90 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              key={countdown}
              className="font-display text-[12rem] font-bold leading-none text-yellow-200 [text-shadow:0_0_80px_rgba(253,224,71,0.55)]"
              initial={{ opacity: 0, scale: 1.8, rotateZ: -8 }}
              animate={{ opacity: 1, scale: 1, rotateZ: 0 }}
              exit={{ opacity: 0, scale: 0.5 }}
              transition={{ duration: 0.5, ease: "backOut" }}
            >
              {countdown}
            </motion.span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {revealed === 3 && !reduceMotion ? (
        <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden" aria-hidden>
          {scienceParticles.map((particle) => (
            <span
              className="ranking-science-particle absolute text-lg text-cyan-200/55"
              key={`${run}-science-${particle.id}`}
              style={{ left: particle.left, top: particle.top, animationDelay: particle.delay }}
            >
              {particle.symbol}
            </span>
          ))}
        </div>
      ) : null}

      {revealed === 3 && !reduceMotion ? (
        <div className="pointer-events-none absolute inset-0 z-30 overflow-hidden" aria-hidden>
          {confetti.map((piece) => (
            <i
              className="ranking-confetti absolute -top-8 block h-3 w-2 rounded-[2px]"
              key={`${run}-${piece.id}`}
              style={{
                left: piece.left,
                background: piece.color,
                animationDelay: piece.delay,
                animationDuration: piece.duration,
                rotate: piece.rotate,
              }}
            />
          ))}
        </div>
      ) : null}

      <section className="mx-auto flex min-h-screen w-full max-w-[90rem] flex-col px-5 py-8 sm:px-10 lg:px-16">
        <header className="flex items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur-md">
              <Image
                src="/images/cienciasemfundo.png"
                alt="Ciência e Tecnologia"
                width={571}
                height={437}
                priority
                className="h-12 w-auto sm:h-14"
              />
            </div>
            <div className="hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-cyan-200">
                SNCT Paulista 2026
              </p>
              <p className="mt-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-white/40">
                Dados demonstrativos
              </p>
            </div>
          </div>
          <button
            className="inline-flex min-h-12 items-center gap-2 rounded-full border border-cyan-200/60 bg-cyan-300 px-5 text-sm font-bold text-[#10002b] shadow-[0_0_30px_rgba(0,229,255,0.2)] transition hover:scale-[1.03] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#070313] disabled:cursor-wait disabled:opacity-60 disabled:hover:scale-100 sm:px-6"
            onClick={advanceCeremony}
            disabled={busy}
            type="button"
          >
            {revealed === 3 ? <RotateCcw className="size-4" aria-hidden /> : <Play className="size-4 fill-current" aria-hidden />}
            {buttonLabel}
          </button>
        </header>

        <div className="flex flex-1 flex-col items-center justify-center py-10">
          <motion.div
            className="mb-10 text-center"
            initial={{ opacity: 0, y: -18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.7 }}
          >
            <div className="mx-auto mb-5 flex w-32 items-center gap-3" aria-hidden>
              <span className="h-px flex-1 bg-gradient-to-r from-transparent to-cyan-300/80" />
              <span className="size-1.5 rotate-45 bg-fuchsia-400 shadow-[0_0_14px_#ff2ed1]" />
              <span className="h-px flex-1 bg-gradient-to-l from-transparent to-cyan-300/80" />
            </div>
            <h1 className="font-display text-4xl font-bold leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              Os grandes <span className="bg-gradient-to-r from-white via-cyan-100 to-fuchsia-200 bg-clip-text text-transparent">destaques</span>
            </h1>
          </motion.div>

          <div className="grid w-full max-w-6xl grid-cols-1 items-end gap-4 md:grid-cols-[0.92fr_1.16fr_0.92fr] md:gap-5">
            {[winners[1], winners[2], winners[0]].map((winner) => {
              const sequence = winner.place === 3 ? 1 : winner.place === 2 ? 2 : 3;
              const visible = revealed >= sequence;
              const winnerCard = winner.place === 1;
              return (
                <motion.div
                  className={winnerCard ? "md:order-2" : winner.place === 2 ? "md:order-1" : "md:order-3"}
                  key={winner.place}
                  animate={revealed === 3 && !winnerCard ? { rotateY: winner.place === 2 ? 4 : -4, scale: 0.94 } : { rotateY: 0, scale: 1 }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                >
                  <AnimatePresence mode="wait">
                    {visible ? (
                      <motion.article
                        className={`ranking-card relative overflow-hidden rounded-[1.75rem] border p-5 text-center backdrop-blur-xl sm:p-6 ${
                          winnerCard
                            ? "min-h-[29rem] border-yellow-300/70 bg-gradient-to-b from-yellow-300/25 via-fuchsia-500/12 to-white/[0.06] shadow-[0_0_90px_rgba(255,214,64,0.25)] md:-translate-y-10 md:scale-[1.04]"
                            : "min-h-[20rem] border-white/15 bg-white/[0.06] md:scale-[0.96]"
                        }`}
                        initial={
                          winner.place === 3
                            ? { opacity: 0, scale: 0.72, y: 110, rotateX: 18 }
                            : winner.place === 2
                              ? { opacity: 0, scale: 0.78, x: -120, rotateY: -38 }
                              : { opacity: 0, scale: 0.32, y: 45, rotateX: -24 }
                        }
                        animate={{ opacity: 1, scale: 1, x: 0, y: 0, rotateX: 0, rotateY: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 15 }}
                      >
                        {winnerCard ? <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-yellow-200 to-transparent" /> : null}
                        {winnerCard ? (
                          <div className="relative -mx-3 -mt-5 mb-1 overflow-visible">
                            <div className="absolute inset-x-8 bottom-2 h-12 rounded-full bg-yellow-300/20 blur-2xl" />
                            <RankingThreeCrown animate={!reduceMotion} />
                          </div>
                        ) : (
                          <div className="mx-auto mb-5 grid size-20 place-items-center rounded-full border border-white/15 bg-white/[0.07] text-violet-100">
                            <span className="font-display text-4xl font-bold">{winner.place}</span>
                          </div>
                        )}
                        <motion.p initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }} className={`text-xs font-bold uppercase tracking-[0.32em] ${winnerCard ? "text-yellow-200" : "text-violet-300"}`}>
                          {winner.place}º lugar
                        </motion.p>
                        <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }} className={`mt-3 font-display font-bold leading-tight ${winnerCard ? "text-3xl" : "text-2xl"}`}>{winner.project}</motion.h2>
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.56 }} className="mt-3 min-h-12 rounded-xl border border-white/[0.08] bg-black/10 px-3 py-2">
                          <p className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-violet-300/55">Escola</p>
                          <p className="mt-1 text-sm font-medium leading-snug text-violet-100/80">{winner.school}</p>
                        </motion.div>
                        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="mt-6 flex items-end justify-center gap-4 border-t border-white/10 pt-5">
                          <div className="text-left">
                            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-violet-300/60">Estande</p>
                            <p className="mt-1 text-sm font-semibold">{winner.stand}</p>
                          </div>
                          <div className="h-9 w-px bg-white/10" />
                          <div className="text-left">
                            <p className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-violet-300/60">Pontuação</p>
                            <p className={`mt-1 font-display text-2xl font-bold ${winnerCard ? "text-yellow-200" : "text-cyan-200"}`}>{winner.score}</p>
                          </div>
                        </motion.div>
                      </motion.article>
                    ) : (
                      <div className="relative grid min-h-[13rem] place-items-center overflow-hidden rounded-[1.75rem] border border-white/[0.08] bg-gradient-to-b from-white/[0.035] to-transparent md:min-h-[20rem]">
                        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                        <div className="text-center">
                          <span className="mx-auto grid size-14 place-items-center rounded-full border border-white/10 bg-white/[0.04] font-display text-2xl font-semibold text-white/20 shadow-[0_0_40px_rgba(106,0,255,0.12)]">?</span>
                          <span className="mt-4 block text-[0.65rem] font-bold uppercase tracking-[0.28em] text-white/20">Resultado reservado</span>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>
                  {visible ? (
                    <motion.div
                      className={`ranking-podium mx-auto -mt-1 rounded-b-2xl border-x border-b ${winnerCard ? "h-16 w-[88%] border-yellow-300/30 bg-yellow-300/10" : winner.place === 2 ? "h-11 w-[84%] border-slate-200/15 bg-white/[0.04]" : "h-7 w-[80%] border-orange-300/15 bg-orange-300/[0.04]"}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: winnerCard ? 64 : winner.place === 2 ? 44 : 28, opacity: 1 }}
                      transition={{ delay: 0.2, duration: 0.7, ease: "backOut" }}
                      aria-hidden
                    />
                  ) : null}
                </motion.div>
              );
            })}
          </div>

          <p className="mt-7 text-center text-xs font-semibold uppercase tracking-[0.24em] text-white/35" aria-live="polite">
            {revealed === 0
              ? "Comece revelando o terceiro lugar"
              : revealed === 1
                ? "3º lugar revelado • clique para revelar o 2º"
                : revealed === 2
                  ? "2º lugar revelado • agora vem o grande campeão"
                : <span className="ranking-winner-message text-yellow-200">Parabéns aos vencedores!</span>}
          </p>
        </div>
      </section>
    </main>
  );
}
