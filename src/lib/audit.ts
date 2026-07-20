import "server-only";

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
};

export async function recordAuditEvent(request: Request, event: AuditEvent) {
  await query(
    `
      INSERT INTO snct_audit_logs
        (actor_id, actor_role, action, entity, entity_id, outcome, ip_hash, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
    `,
    [
      event.actorId ?? null,
      event.actorRole ?? null,
      event.action,
      event.entity,
      event.entityId ?? null,
      event.outcome ?? "success",
      hashAuditAddress(request),
      JSON.stringify(event.metadata ?? {}),
    ],
  );
}

export async function readAuditEvents(limit = 100) {
  const result = await query<{
    id: number;
    actor_id: string | null;
    actor_role: UserRole | null;
    action: string;
    entity: string;
    entity_id: string | null;
    outcome: "success" | "failure" | "blocked";
    metadata: Record<string, unknown>;
    created_at: Date;
  }>(
    `
      SELECT id, actor_id, actor_role, action, entity, entity_id,
             outcome, metadata, created_at
      FROM snct_audit_logs
      ORDER BY created_at DESC
      LIMIT $1
    `,
    [Math.min(Math.max(limit, 1), 250)],
  );

  return result.rows.map((row) => ({
    id: row.id,
    actorId: row.actor_id,
    actorRole: row.actor_role,
    action: row.action,
    entity: row.entity,
    entityId: row.entity_id,
    outcome: row.outcome,
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
  }));
}
