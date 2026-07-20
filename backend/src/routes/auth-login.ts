import { auth, ensureBootstrapAdmin } from "@/lib/auth";
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
    const response = await auth.api.signInEmail({
      body: { email, password },
      headers: request.headers,
      asResponse: true,
    });

    await recordAuditEvent(request, {
      action: "auth.login",
      entity: "session",
      outcome: response.ok ? "success" : "failure",
      metadata: { status: response.status },
    });
    return response;
  } catch (error) {
    await recordAuditEvent(request, {
      action: "auth.login",
      entity: "session",
      outcome:
        error instanceof Response && error.status === 429
          ? "blocked"
          : "failure",
    }).catch(() => {});
    return securityErrorResponse(error);
  }
}
