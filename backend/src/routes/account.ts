import { findUsuarioById, getSession, requireRole } from "@/lib/auth";
import { mapUsuarioRow } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import {
  assertTrustedMutation,
  enforceRateLimit,
  securityErrorResponse,
} from "@/lib/request-security";
import { rotateVisitorQr } from "@/lib/snct-store";

export async function POST(request: Request) {
  try {
    assertTrustedMutation(request);
    const session = await getSession();
    if (!session)
      return Response.json({ error: "Não autorizado." }, { status: 401 });

    const body = (await request.json().catch(() => null)) as {
      action?: string;
    } | null;
    if (body?.action !== "exportData") {
      return Response.json({ error: "Ação inválida." }, { status: 400 });
    }

    await enforceRateLimit({
      request,
      scope: "account-export",
      identifier: session.userId,
      limit: 3,
      windowSeconds: 60 * 60,
    });

    const row = await findUsuarioById(session.userId);
    if (!row)
      return Response.json({ error: "Conta não encontrada." }, { status: 404 });

    const user = mapUsuarioRow(row);
    await recordAuditEvent(request, {
      actorId: session.userId,
      actorRole: session.role,
      action: "privacy.export",
      entity: "usuario",
      entityId: session.userId,
    });

    const payload = JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        data: {
          id: user.id,
          nomeCompleto: user.name,
          email: user.email,
          telefone: user.telefone,
          cpf: user.cpf,
          role: user.roleCodigo,
          dataNascimento: user.dataNascimento,
          qrCodeHash: user.qrCodeHash,
          createdAt: user.createdAt,
        },
      },
      null,
      2,
    );
    return new Response(payload, {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="meus-dados-snct-${session.userId}.json"`,
      },
    });
  } catch (error) {
    return securityErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertTrustedMutation(request);
    const session = await requireRole(
      "visitante",
      "aluno",
      "avaliador",
      "professor",
      "staff",
    );
    if (!session)
      return Response.json({ error: "Não autorizado." }, { status: 401 });
    await enforceRateLimit({
      request,
      scope: "qr-rotation",
      identifier: session.userId,
      limit: 3,
      windowSeconds: 60 * 60,
    });
    const body = (await request.json().catch(() => null)) as {
      action?: string;
    } | null;
    if (body?.action !== "rotateQr") {
      return Response.json({ error: "Ação inválida." }, { status: 400 });
    }
    const credential = await rotateVisitorQr(session.userId);
    await recordAuditEvent(request, {
      actorId: session.userId,
      actorRole: session.role,
      action: "credential.rotate",
      entity: "usuario",
      entityId: session.userId,
    });
    return Response.json({ credential });
  } catch (error) {
    return securityErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    assertTrustedMutation(request);
    const session = await getSession();
    if (!session)
      return Response.json({ error: "Não autorizado." }, { status: 401 });
    if (session.role === "admin") {
      return Response.json(
        { error: "Conta administrativa não pode ser excluída por este fluxo." },
        { status: 403 },
      );
    }
    const { query } = await import("@/lib/db");
    await query("DELETE FROM usuarios WHERE id = $1", [session.userId]);
    await recordAuditEvent(request, {
      actorId: session.userId,
      actorRole: session.role,
      action: "user.delete_self",
      entity: "usuario",
      entityId: session.userId,
    });
    return Response.json({ success: true });
  } catch (error) {
    return securityErrorResponse(error);
  }
}
