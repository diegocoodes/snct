import { query } from "@/lib/db";
import { hashAuditAddress } from "@/lib/request-security";
import type { UserRole } from "@/lib/snct-types";

export type AuditEvent = {
  action: string;
  entity: string;
  entityId?: string;
  outcome?: "success" | "failure" | "blocked";
  actorId?: string;
  actorRole?: UserRole;
  metadata?: Record<string, string | number | boolean | null>;
  dadosAnteriores?: Record<string, unknown> | null;
  dadosNovos?: Record<string, unknown> | null;
};

export async function recordAuditEvent(request: Request, event: AuditEvent) {
  await query(
    `INSERT INTO auditoria
      (usuario_responsavel_id, acao, entidade, entidade_id, dados_anteriores, dados_novos)
     VALUES ($1, $2, $3, $4, CAST($5 AS JSON), CAST($6 AS JSON))`,
    [
      event.actorId ?? null,
      event.action,
      event.entity,
      event.entityId ?? null,
      JSON.stringify({
        ...(event.dadosAnteriores ?? {}),
        _meta: {
          outcome: event.outcome ?? "success",
          actorRole: event.actorRole ?? null,
          ipHash: hashAuditAddress(request),
          ...(event.metadata ?? {}),
        },
      }),
      event.dadosNovos ? JSON.stringify(event.dadosNovos) : null,
    ],
  );
}

export async function readAuditEvents(limit = 100) {
  const result = await query<{
    id: number;
    usuario_responsavel_id: number | bigint | string | null;
    acao: string;
    entidade: string;
    entidade_id: string | null;
    dados_anteriores: Record<string, unknown> | null;
    dados_novos: Record<string, unknown> | null;
    created_at: Date;
  }>(
    `SELECT id, usuario_responsavel_id, acao, entidade, entidade_id,
            dados_anteriores, dados_novos, created_at
     FROM auditoria
     ORDER BY created_at DESC
     LIMIT $1`,
    [Math.min(Math.max(limit, 1), 250)],
  );

  return result.rows.map((row) => {
    const prev = (row.dados_anteriores ?? {}) as Record<string, unknown>;
    const meta =
      prev && typeof prev === "object" && "_meta" in prev
        ? (prev._meta as Record<string, unknown>)
        : {};
    return {
      id: row.id,
      actorId: row.usuario_responsavel_id
        ? String(row.usuario_responsavel_id)
        : null,
      actorRole: (meta.actorRole as UserRole | null) ?? null,
      action: row.acao,
      entity: row.entidade,
      entityId: row.entidade_id,
      outcome: (meta.outcome as "success" | "failure" | "blocked") ?? "success",
      metadata: meta,
      dadosAnteriores: row.dados_anteriores,
      dadosNovos: row.dados_novos,
      createdAt: row.created_at.toISOString(),
    };
  });
}
