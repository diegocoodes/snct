import { requireRole, toPublicUser } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import {
  assertTrustedMutation,
  enforceRateLimit,
  securityErrorResponse,
} from "@/lib/request-security";
import { updateSnctStore } from "@/lib/snct-store";
import type { StoredUser } from "@/lib/snct-types";

function normalizeQrValue(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().slice(0, 500);
  if (trimmed.startsWith("SNCT:")) return trimmed.slice(5);
  try {
    const url = new URL(trimmed);
    return url.pathname.split("/").filter(Boolean).at(-1) ?? "";
  } catch {
    return trimmed;
  }
}

export async function POST(request: Request) {
  try {
    assertTrustedMutation(request);
    const session = await requireRole("staff", "admin");
    if (!session)
      return Response.json({ error: "Não autorizado." }, { status: 401 });

    await enforceRateLimit({
      request,
      scope: "staff-scan",
      identifier: session.userId,
      limit: 60,
      windowSeconds: 60,
    });

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const token = normalizeQrValue(body?.token);
    const action = body?.action === "gift" ? "gift" : "checkin";
    if (!token)
      return Response.json({ error: "QR Code inválido." }, { status: 400 });

    const result = await updateSnctStore<
      StoredUser | "gift-needs-checkin" | "expired" | "revoked" | null
    >((store) => {
      const visitor = store.users.find(
        (user) => user.role === "visitor" && user.visitorHash === token,
      );
      if (!visitor) return null;
      if (visitor.qrRevokedAt) return "revoked";
      if (
        visitor.qrExpiresAt &&
        new Date(visitor.qrExpiresAt).getTime() <= Date.now()
      ) {
        return "expired";
      }
      if (action === "gift" && !visitor.checkedInAt)
        return "gift-needs-checkin";
      const now = new Date().toISOString();
      if (action === "checkin" && !visitor.checkedInAt)
        visitor.checkedInAt = now;
      if (action === "gift" && !visitor.giftDeliveredAt)
        visitor.giftDeliveredAt = now;
      return visitor;
    });

    if (!result) {
      await recordAuditEvent(request, {
        actorId: session.userId,
        actorRole: session.role,
        action: `credential.${action}`,
        entity: "credential",
        outcome: "failure",
      });
      return Response.json(
        { error: "Visitante não encontrado." },
        { status: 404 },
      );
    }
    if (result === "gift-needs-checkin") {
      return Response.json(
        { error: "Faça o check-in antes de entregar o brinde." },
        { status: 409 },
      );
    }
    if (result === "expired" || result === "revoked") {
      await recordAuditEvent(request, {
        actorId: session.userId,
        actorRole: session.role,
        action: `credential.${action}`,
        entity: "credential",
        outcome: "blocked",
        metadata: { reason: result },
      });
      return Response.json(
        {
          error:
            result === "expired"
              ? "Credencial expirada."
              : "Credencial revogada.",
        },
        { status: 410 },
      );
    }

    await recordAuditEvent(request, {
      actorId: session.userId,
      actorRole: session.role,
      action: `credential.${action}`,
      entity: "visitor",
      entityId: result.id,
    });
    return Response.json({ visitor: toPublicUser(result), action });
  } catch (error) {
    return securityErrorResponse(error);
  }
}
