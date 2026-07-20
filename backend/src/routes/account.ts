import { randomUUID } from "node:crypto";

import { auth, getSession, requireRole } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { query } from "@/lib/db";
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
    const data = await query<{
      id: string;
      name: string;
      email: string;
      role: string;
      email_verified: boolean;
      created_at: Date;
      age: number | null;
      checked_in_at: Date | null;
      gift_delivered_at: Date | null;
      privacy_accepted_at: Date | null;
      privacy_version: string | null;
      qr_expires_at: Date | null;
      qr_revoked_at: Date | null;
    }>(
      `SELECT users.id, users.name, users.email, users.role,
              users.\`emailVerified\` AS email_verified,
              users.\`createdAt\` AS created_at,
              profiles.age, profiles.checked_in_at, profiles.gift_delivered_at,
              profiles.privacy_accepted_at, profiles.privacy_version,
              profiles.qr_expires_at, profiles.qr_revoked_at
       FROM auth_users AS users
       LEFT JOIN snct_profiles AS profiles ON profiles.user_id = users.id
       WHERE users.id = $1`,
      [session.userId],
    );
    if (!data.rows[0])
      return Response.json({ error: "Conta não encontrada." }, { status: 404 });

    const protocol = `SNCT-ACESSO-${randomUUID().slice(0, 8).toUpperCase()}`;
    await query(
      `INSERT INTO snct_privacy_requests
        (user_id, request_type, status, protocol, completed_at)
       VALUES ($1, 'access', 'completed', $2, now())`,
      [session.userId, protocol],
    );
    await recordAuditEvent(request, {
      actorId: session.userId,
      actorRole: session.role,
      action: "privacy.export",
      entity: "user",
      entityId: session.userId,
    });

    const payload = JSON.stringify(
      {
        protocol,
        exportedAt: new Date().toISOString(),
        controller: "Prefeitura do Paulista — SNCT Paulista 2026",
        data: data.rows[0],
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
    const session = await requireRole("visitor");
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
    if (!credential)
      return Response.json(
        { error: "Credencial não encontrada." },
        { status: 404 },
      );
    await recordAuditEvent(request, {
      actorId: session.userId,
      actorRole: session.role,
      action: "credential.rotate",
      entity: "credential",
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
        {
          error:
            "A conta administrativa inicial não pode ser excluída pelo portal.",
        },
        { status: 403 },
      );
    }
    await enforceRateLimit({
      request,
      scope: "account-delete",
      identifier: session.userId,
      limit: 2,
      windowSeconds: 60 * 60,
    });
    const body = (await request.json().catch(() => null)) as {
      password?: string;
    } | null;
    if (!body?.password) {
      return Response.json({ error: "Confirme sua senha." }, { status: 400 });
    }

    const protocol = `SNCT-EXCLUSAO-${randomUUID().slice(0, 8).toUpperCase()}`;
    await query(
      `INSERT INTO snct_privacy_requests
        (user_id, request_type, status, protocol, details)
       VALUES ($1, 'deletion', 'pending', $2, CAST($3 AS JSON))`,
      [session.userId, protocol, JSON.stringify({ requestedByUser: true })],
    );
    await recordAuditEvent(request, {
      actorId: session.userId,
      actorRole: session.role,
      action: "privacy.delete-request",
      entity: "user",
      entityId: session.userId,
      metadata: { protocol },
    });
    const response = await auth.api.deleteUser({
      body: { password: body.password, callbackURL: "/" },
      headers: request.headers,
      asResponse: true,
    });
    return response;
  } catch (error) {
    return securityErrorResponse(error);
  }
}
