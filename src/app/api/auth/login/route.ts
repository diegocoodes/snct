import { authenticateUser, setSession } from "@/lib/auth";
import type { UserRole } from "@/lib/snct-types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const email = typeof body?.email === "string" ? body.email : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const role = body?.role as UserRole | undefined;

  if (
    !email ||
    !password ||
    !["visitor", "staff", "admin"].includes(role ?? "")
  ) {
    return Response.json(
      { error: "Preencha todos os campos." },
      { status: 400 },
    );
  }

  const session = await authenticateUser(email, password, role!);
  if (!session) {
    return Response.json(
      { error: "E-mail, senha ou perfil de acesso inválido." },
      { status: 401 },
    );
  }

  await setSession(session);
  return Response.json({ role: session.role });
}
