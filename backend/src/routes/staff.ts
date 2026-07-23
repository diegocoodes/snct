import { requireRole } from "@/lib/auth";
import {
  getUsuarioByQrHash,
  normalizeQrPayload,
  registrarCheckin,
} from "@/lib/checkins";
import {
  assertTrustedMutation,
  enforceRateLimit,
  securityErrorResponse,
} from "@/lib/request-security";

/** Endpoint legado do scanner — usa a tabela checkins. */
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
    const token = normalizeQrPayload(body?.token);
    if (!token)
      return Response.json({ error: "QR Code inválido." }, { status: 400 });

    const found = await getUsuarioByQrHash(token);
    if (!found) {
      return Response.json(
        { error: "Participante não encontrado." },
        { status: 404 },
      );
    }

    const result = await registrarCheckin({
      usuarioId: found.id,
      metodo: "QRCODE",
      realizadoPorUsuarioId: session.userId,
      actorRole: session.role,
      request,
    });
    if (!result.ok) {
      return Response.json(
        {
          error: result.error,
          usuario: "usuario" in result ? result.usuario : found,
        },
        { status: result.status },
      );
    }
    return Response.json({
      visitor: result.usuario,
      usuario: result.usuario,
      action: "checkin",
    });
  } catch (error) {
    return securityErrorResponse(error);
  }
}
