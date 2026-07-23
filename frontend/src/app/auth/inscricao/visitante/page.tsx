import { redirect } from "next/navigation";

import { InscricaoPage } from "@/components/forms/inscricao-page";
import { getSession } from "@/lib/auth";

export default async function Page() {
  if (await getSession()) redirect("/perfil");
  return <InscricaoPage roleCodigo="VISITANTE" />;
}
