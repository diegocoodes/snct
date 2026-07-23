import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";

/** Mantém /cadastro apontando para o hub de inscrições. */
export default async function RegisterPage() {
  if (await getSession()) redirect("/perfil");
  redirect("/auth/inscricao");
}
