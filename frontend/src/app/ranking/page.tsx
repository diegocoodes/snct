import type { Metadata } from "next";

import { RankingCeremony } from "@/components/ranking/ranking-ceremony";

// A política CSP usa nonce por requisição; a renderização dinâmica permite
// que o Next aplique esse nonce aos scripts necessários para a hidratação.
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Cerimônia de Premiação | SNCT Paulista 2026",
  description: "Prévia da animação de revelação do ranking dos estandes.",
};

export default function RankingPage() {
  return <RankingCeremony />;
}
