import { requireRole } from "@/lib/auth";
import {
  buscarParticipantes,
  detectSearchMetodo,
  getUsuarioByQrHash,
  getUsuarioCheckinHistorico,
  listParticipantesCheckin,
  normalizeQrPayload,
  registrarCheckin,
} from "@/lib/checkins";
import {
  assertTrustedMutation,
  enforceRateLimit,
  securityErrorResponse,
} from "@/lib/request-security";
import type { CheckinMetodo } from "@/lib/snct-types";

async function authorizeStaff(request: Request) {
  const session = await requireRole("staff", "admin");
  if (!session) return null;
  await enforceRateLimit({
    request,
    scope: "checkins",
    identifier: session.userId,
    limit: 120,
    windowSeconds: 60,
  });
  return session;
}

export async function GET_PARTICIPANTES(request: Request) {
  try {
    const session = await authorizeStaff(request);
    if (!session)
      return Response.json({ error: "Não autorizado." }, { status: 401 });
    const participantes = await listParticipantesCheckin();
    return Response.json({ participantes });
  } catch (error) {
    return securityErrorResponse(error);
  }
}

export async function GET_BUSCAR(request: Request) {
  try {
    const session = await authorizeStaff(request);
    if (!session)
      return Response.json({ error: "Não autorizado." }, { status: 401 });
    const url = new URL(request.url);
    const termo = url.searchParams.get("termo") ?? "";
    const participantes = await buscarParticipantes(termo);
    return Response.json({
      participantes,
      metodoSugerido: detectSearchMetodo(termo),
    });
  } catch (error) {
    return securityErrorResponse(error);
  }
}

export async function GET_POR_QR(request: Request, qrCodeHash: string) {
  try {
    const session = await authorizeStaff(request);
    if (!session)
      return Response.json({ error: "Não autorizado." }, { status: 401 });
    const hash = normalizeQrPayload(qrCodeHash);
    const usuario = await getUsuarioByQrHash(hash);
    if (!usuario) {
      return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
    }
    return Response.json({ usuario });
  } catch (error) {
    return securityErrorResponse(error);
  }
}

export async function GET_HISTORICO(request: Request, usuarioId: string) {
  try {
    const session = await authorizeStaff(request);
    if (!session)
      return Response.json({ error: "Não autorizado." }, { status: 401 });
    const historico = await getUsuarioCheckinHistorico(usuarioId);
    return Response.json({ historico });
  } catch (error) {
    return securityErrorResponse(error);
  }
}

export async function POST_CHECKIN(request: Request) {
  try {
    assertTrustedMutation(request);
    const session = await authorizeStaff(request);
    if (!session)
      return Response.json({ error: "Não autorizado." }, { status: 401 });

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const usuarioId =
      typeof body?.usuario_id === "string"
        ? body.usuario_id
        : typeof body?.usuarioId === "string"
          ? body.usuarioId
          : "";
    const metodo = String(body?.metodo ?? "MANUAL").toUpperCase() as CheckinMetodo;

    if (!usuarioId) {
      return Response.json({ error: "Informe o usuário." }, { status: 400 });
    }

    const result = await registrarCheckin({
      usuarioId,
      metodo,
      realizadoPorUsuarioId: session.userId,
      actorRole: session.role,
      request,
    });

    if (!result.ok) {
      return Response.json(
        { error: result.error, usuario: "usuario" in result ? result.usuario : undefined },
        { status: result.status },
      );
    }

    return Response.json({
      checkin: result.checkin,
      usuario: result.usuario,
    });
  } catch (error) {
    return securityErrorResponse(error);
  }
}
