import { clearSessionCookie, destroySession, getSession } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import {
  assertTrustedMutation,
  securityErrorResponse,
} from "@/lib/request-security";

export async function POST(request: Request) {
  try {
    assertTrustedMutation(request);
    const session = await getSession();
    await destroySession(request.headers);
    if (session) {
      await recordAuditEvent(request, {
        action: "auth.logout",
        entity: "sessao",
        actorId: session.userId,
        actorRole: session.role,
      });
    }
    return Response.json(
      { success: true },
      { headers: { "Set-Cookie": clearSessionCookie() } },
    );
  } catch (error) {
    return securityErrorResponse(error);
  }
}
