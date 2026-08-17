import type { Metadata } from "next";

import { RankingCeremony } from "@/components/ranking/ranking-ceremony";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cerimônia de Premiação | SNCT Paulista 2026",
  description: "Prévia da animação de revelação do ranking dos estandes.",
};

export default function RakingPage() {
  return <RankingCeremony />;
}
