import { auth, getSession } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import {
  assertTrustedMutation,
  securityErrorResponse,
} from "@/lib/request-security";

export async function POST(request: Request) {
  try {
    assertTrustedMutation(request);
    const session = await getSession();
    const response = await auth.api.signOut({
      headers: request.headers,
      asResponse: true,
    });
    if (session) {
      await recordAuditEvent(request, {
        actorId: session.userId,
        actorRole: session.role,
        action: "auth.logout",
        entity: "session",
      });
    }
    response.headers.set("Clear-Site-Data", '"cache", "storage"');
    return response;
  } catch (error) {
    return securityErrorResponse(error);
  }
}
