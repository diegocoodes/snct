export type NoticeStatus = "aberto" | "encerrado";

export type FeaturedNotice = {
  title: string;
  registration: string;
  status: NoticeStatus;
};

export type UpcomingEvent = {
  date: string;
  time: string;
  title: string;
  location: string;
};

export const featuredNotices: readonly FeaturedNotice[] = [
  {
    title:
      "I Workshop, Lucro Turbinado: Estratégias Digitais e IA para o Comércio de Paulista",
    registration: "06/11–26/11/2026",
    status: "aberto",
  },
  {
    title: "PITCH — O roteiro para uma apresentação eficaz",
    registration: "20/10–27/10/2025",
    status: "encerrado",
  },
  {
    title: "Campeonato Free Fire Mobile",
    registration: "16/10–23/10/2025",
    status: "encerrado",
  },
  {
    title: "Esquenta SNCT Caravana REC’n’Play",
    registration: "05/10–16/10/2025",
    status: "encerrado",
  },
  {
    title: "Arena Gamer",
    registration: "29/09–21/10/2025",
    status: "encerrado",
  },
] as const;

export const upcomingEvents: readonly UpcomingEvent[] = [
  {
    date: "24/10",
    time: "08:00",
    title: "Credenciamento",
    location: "Local a definir",
  },
  {
    date: "24/10",
    time: "08:00",
    title: "Uso da Robótica no Meio Ambiente",
    location: "Arena Robótica",
  },
  {
    date: "24/10",
    time: "09:00",
    title: "Abertura Oficial — Autoridades",
    location: "Palco principal",
  },
  {
    date: "24/10",
    time: "09:00",
    title: "Abertura",
    location: "Arena Gamer",
  },
  {
    date: "24/10",
    time: "09:00",
    title: "Valorant — Mira Bamba x RCL",
    location: "Arena Gamer",
  },
  {
    date: "24/10",
    time: "09:15",
    title: "Introdução à Programação com Arduino",
    location: "Arena Robótica",
  },
] as const;
