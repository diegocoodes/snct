import { Suspense } from "react";

import { ConfirmacaoInscricaoClient } from "@/components/forms/confirmacao-inscricao";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-blue-gray">Carregando…</div>}>
      <ConfirmacaoInscricaoClient />
    </Suspense>
  );
}
