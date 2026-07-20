import { randomUUID } from "node:crypto";

import {
  createVisitorHash,
  hashPassword,
  setSession,
  toPublicUser,
} from "@/lib/auth";
import { updateSnctStore } from "@/lib/snct-store";
import type { StoredUser } from "@/lib/snct-types";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  const email =
    typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body?.password === "string" ? body.password : "";
  const age = Number(body?.age);
  const reservedAdminEmail = process.env.SNCT_ADMIN_EMAIL?.toLowerCase();

  if (
    name.length < 2 ||
    !isEmail(email) ||
    !Number.isInteger(age) ||
    age < 5 ||
    age > 120
  ) {
    return Response.json(
      { error: "Informe nome, e-mail e idade válidos." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return Response.json(
      { error: "A senha precisa ter pelo menos 8 caracteres." },
      { status: 400 },
    );
  }
  if (email === reservedAdminEmail) {
    return Response.json(
      { error: "Este e-mail é reservado para a administração." },
      { status: 409 },
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await updateSnctStore<StoredUser | null>((store) => {
    if (
      store.users.some((candidate) => candidate.email.toLowerCase() === email)
    ) {
      return null;
    }

    const created: StoredUser = {
      id: `visitor-${randomUUID()}`,
      name,
      email,
      age,
      role: "visitor",
      passwordHash,
      visitorHash: createVisitorHash(),
      createdAt: new Date().toISOString(),
    };
    store.users.push(created);
    return created;
  });

  if (!user) {
    return Response.json(
      { error: "Já existe uma conta com este e-mail." },
      { status: 409 },
    );
  }

  await setSession({
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    expiresAt: Date.now() + 8 * 60 * 60 * 1000,
  });

  return Response.json({ user: toPublicUser(user) }, { status: 201 });
}
