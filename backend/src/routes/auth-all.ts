import { getSession } from "@/lib/auth";

/** Compatibilidade com rotas Better Auth antigas — sessão atual. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ user: null, session: null });
  }
  return Response.json({
    user: {
      id: session.userId,
      name: session.name,
      email: session.email,
      role: session.role,
      emailVerified: session.emailVerified,
      twoFactorEnabled: session.mfaEnabled,
    },
    session: {
      expiresAt: new Date(session.expiresAt).toISOString(),
    },
  });
}

export async function POST() {
  return Response.json(
    { error: "Use /api/auth/login ou /api/auth/logout." },
    { status: 400 },
  );
}
