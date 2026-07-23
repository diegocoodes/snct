import {
  buildSessionCookie,
  ensureBootstrapAdmin,
  loginWithPassword,
} from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import {
  assertTrustedMutation,
  enforceRateLimit,
  securityErrorResponse,
} from "@/lib/request-security";

export async function POST(request: Request) {
  try {
    assertTrustedMutation(request);
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    await enforceRateLimit({
      request,
      scope: "login",
      identifier: email,
      limit: 5,
      windowSeconds: 60,
    });

    if (!email || !password) {
      return Response.json(
        { error: "Preencha todos os campos." },
        { status: 400 },
      );
    }

    await ensureBootstrapAdmin();
    const result = await loginWithPassword(email, password);

    await recordAuditEvent(request, {
      action: "auth.login",
      entity: "sessao",
      outcome: result.ok ? "success" : "failure",
      actorId: result.ok ? result.user.id : undefined,
      actorRole: result.ok ? result.user.role : undefined,
    });

    if (!result.ok) {
      return Response.json({ error: result.error }, { status: 401 });
    }

    return Response.json(
      {
        user: {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role,
        },
      },
      {
        status: 200,
        headers: {
          "Set-Cookie": buildSessionCookie(
            result.session.token,
            result.session.expiresAt,
          ),
        },
      },
    );
  } catch (error) {
    await recordAuditEvent(request, {
      action: "auth.login",
      entity: "sessao",
      outcome:
        error instanceof Response && error.status === 429
          ? "blocked"
          : "failure",
    }).catch(() => {});
    return securityErrorResponse(error);
  }
}
