import { recordAuditEvent } from "@/lib/audit";
import { isValidCpf, maskCpf, maskPhone, onlyDigits } from "@/lib/cpf";
import { query, transaction, clientQuery } from "@/lib/db";
import { AUTH_ROLE_TO_CODIGO, CHECKIN_ELIGIBLE_ROLES } from "@/lib/roles";
import type {
  CheckinMetodo,
  CheckinRecord,
  RoleCodigo,
  StaffUserView,
  UserRole,
} from "@/lib/snct-types";
import { ROLE_CODIGO_TO_AUTH } from "@/lib/roles-constants";

function todayInEventTimezone() {
  const timeZone = process.env.APP_TIMEZONE || process.env.TZ || "America/Recife";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function mapCheckin(row: {
  id: number | string;
  usuario_id: number | string;
  data_checkin: Date | string;
  horario_checkin: Date;
  realizado_por_usuario_id: number | string;
  metodo: CheckinMetodo;
  created_at: Date;
}): CheckinRecord {
  const data =
    typeof row.data_checkin === "string"
      ? row.data_checkin.slice(0, 10)
      : row.data_checkin.toISOString().slice(0, 10);
  return {
    id: String(row.id),
    usuarioId: String(row.usuario_id),
    dataCheckin: data,
    horarioCheckin: row.horario_checkin.toISOString(),
    realizadoPorUsuarioId: String(row.realizado_por_usuario_id),
    metodo: row.metodo,
    createdAt: row.created_at.toISOString(),
  };
}

async function getCheckinHoje(usuarioId: string) {
  const today = todayInEventTimezone();
  const result = await query<{ id: number }>(
    `SELECT id FROM checkins WHERE usuario_id = $1 AND data_checkin = $2 LIMIT 1`,
    [usuarioId, today],
  );
  return Boolean(result.rows[0]);
}

async function getHistorico(usuarioId: string) {
  const result = await query<{
    id: number;
    usuario_id: number;
    data_checkin: Date | string;
    horario_checkin: Date;
    realizado_por_usuario_id: number;
    metodo: CheckinMetodo;
    created_at: Date;
  }>(
    `SELECT id, usuario_id, data_checkin, horario_checkin,
            realizado_por_usuario_id, metodo, created_at
     FROM checkins WHERE usuario_id = $1
     ORDER BY data_checkin DESC, horario_checkin DESC LIMIT 30`,
    [usuarioId],
  );
  return result.rows.map(mapCheckin);
}

type UserRow = {
  id: number;
  nome_completo: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  foto: string | null;
  ativo: number | boolean;
  qr_code_hash: string;
  role_codigo: RoleCodigo;
  role_nome: string;
};

function toStaffView(
  row: UserRow,
  checkinHoje: boolean,
  historico: CheckinRecord[],
): StaffUserView {
  return {
    id: String(row.id),
    nomeCompleto: row.nome_completo,
    email: row.email,
    telefoneMascarado: maskPhone(row.telefone),
    cpfMascarado: maskCpf(row.cpf),
    foto: row.foto ?? undefined,
    role: ROLE_CODIGO_TO_AUTH[row.role_codigo],
    roleCodigo: row.role_codigo,
    roleNome: row.role_nome,
    ativo: Boolean(row.ativo),
    checkinHoje,
    historicoCheckins: historico,
  };
}

const participantSelect = `
  SELECT u.id, u.nome_completo, u.email, u.telefone, u.cpf, u.foto,
         u.ativo, u.qr_code_hash, r.codigo AS role_codigo, r.nome AS role_nome
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.role_id
  WHERE r.codigo IN ('STAFF', 'AVALIADOR', 'PROFESSOR', 'VISITANTE', 'ALUNO')
`;

export async function listParticipantesCheckin(limit = 50) {
  const result = await query<UserRow>(
    `${participantSelect} ORDER BY u.nome_completo ASC LIMIT $1`,
    [Math.min(Math.max(limit, 1), 200)],
  );
  const views: StaffUserView[] = [];
  for (const row of result.rows) {
    views.push(
      toStaffView(row, await getCheckinHoje(String(row.id)), await getHistorico(String(row.id))),
    );
  }
  return views;
}

export async function buscarParticipantes(termo: string) {
  const raw = termo.trim().slice(0, 120);
  if (raw.length < 2) return [];
  const digits = onlyDigits(raw);
  const like = `%${raw.toLowerCase()}%`;
  const result = await query<UserRow>(
    `${participantSelect}
     AND (
       lower(u.nome_completo) LIKE $1
       OR lower(u.email) LIKE $1
       OR ($2 <> '' AND u.cpf LIKE CONCAT('%', $2, '%'))
       OR ($2 <> '' AND u.telefone LIKE CONCAT('%', $2, '%'))
     )
     ORDER BY u.nome_completo ASC LIMIT 40`,
    [like, digits],
  );
  const views: StaffUserView[] = [];
  for (const row of result.rows) {
    views.push(
      toStaffView(row, await getCheckinHoje(String(row.id)), await getHistorico(String(row.id))),
    );
  }
  return views;
}

export async function getUsuarioByQrHash(qrCodeHash: string) {
  const hash = qrCodeHash.trim().slice(0, 255);
  if (!hash) return null;
  const result = await query<UserRow>(
    `${participantSelect} AND u.qr_code_hash = $1 LIMIT 1`,
    [hash],
  );
  const row = result.rows[0];
  if (!row) return null;
  return toStaffView(
    row,
    await getCheckinHoje(String(row.id)),
    await getHistorico(String(row.id)),
  );
}

export async function getUsuarioCheckinHistorico(usuarioId: string) {
  return getHistorico(usuarioId);
}

export async function registrarCheckin(params: {
  usuarioId: string;
  metodo: CheckinMetodo;
  realizadoPorUsuarioId: string;
  request?: Request;
  actorRole?: UserRole;
}) {
  const metodos: CheckinMetodo[] = ["QRCODE", "NOME", "EMAIL", "CPF", "MANUAL"];
  if (!metodos.includes(params.metodo)) {
    return { ok: false as const, status: 400, error: "Método de check-in inválido." };
  }

  const userResult = await query<UserRow>(
    `SELECT u.id, u.nome_completo, u.email, u.telefone, u.cpf, u.foto,
            u.ativo, u.qr_code_hash, r.codigo AS role_codigo, r.nome AS role_nome
     FROM usuarios u
     INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1 LIMIT 1`,
    [params.usuarioId],
  );
  const user = userResult.rows[0];
  if (!user) {
    return { ok: false as const, status: 404, error: "Usuário não encontrado." };
  }
  if (!Boolean(user.ativo)) {
    if (params.request) {
      await recordAuditEvent(params.request, {
        actorId: params.realizadoPorUsuarioId,
        actorRole: params.actorRole,
        action: "checkin.inactive_user",
        entity: "checkin",
        entityId: String(user.id),
        outcome: "blocked",
      });
    }
    return { ok: false as const, status: 403, error: "Usuário inativo." };
  }
  if (user.role_codigo === "ADMINISTRADOR") {
    return {
      ok: false as const,
      status: 403,
      error: "Administradores não realizam check-in neste fluxo.",
    };
  }
  if (!(CHECKIN_ELIGIBLE_ROLES as readonly string[]).includes(user.role_codigo)) {
    return {
      ok: false as const,
      status: 403,
      error: "Perfil não elegível para check-in.",
    };
  }

  const today = todayInEventTimezone();
  const existing = await query<{ id: number }>(
    `SELECT id FROM checkins WHERE usuario_id = $1 AND data_checkin = $2 LIMIT 1`,
    [params.usuarioId, today],
  );
  if (existing.rows[0]) {
    if (params.request) {
      await recordAuditEvent(params.request, {
        actorId: params.realizadoPorUsuarioId,
        actorRole: params.actorRole,
        action: "checkin.duplicate",
        entity: "checkin",
        entityId: String(user.id),
        outcome: "blocked",
        metadata: { data: today },
      });
    }
    return {
      ok: false as const,
      status: 409,
      error: "Check-in do dia já foi realizado.",
      usuario: toStaffView(user, true, await getHistorico(String(user.id))),
    };
  }

  try {
    await query(
      `INSERT INTO checkins
        (usuario_id, data_checkin, horario_checkin, realizado_por_usuario_id, metodo)
       VALUES ($1, $2, NOW(3), $3, $4)`,
      [params.usuarioId, today, params.realizadoPorUsuarioId, params.metodo],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("Duplicate") || message.includes("ER_DUP_ENTRY")) {
      return {
        ok: false as const,
        status: 409,
        error: "Check-in do dia já foi realizado.",
      };
    }
    throw error;
  }

  const historico = await getHistorico(String(user.id));
  const usuario = toStaffView(user, true, historico);

  if (params.request) {
    await recordAuditEvent(params.request, {
      actorId: params.realizadoPorUsuarioId,
      actorRole: params.actorRole,
      action:
        params.metodo === "MANUAL" ? "checkin.manual" : "checkin.register",
      entity: "checkin",
      entityId: historico[0]?.id,
      metadata: {
        usuarioId: params.usuarioId,
        metodo: params.metodo,
        data: today,
        role: user.role_codigo,
      },
    });
  }

  return { ok: true as const, checkin: historico[0], usuario };
}

export function normalizeQrPayload(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim().slice(0, 800);
  if (trimmed.startsWith("SNCT:")) return trimmed.slice(5);
  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get("qr") ?? url.searchParams.get("hash");
    if (fromQuery?.trim()) return fromQuery.trim().slice(0, 255);
    return (url.pathname.split("/").filter(Boolean).at(-1) ?? "").slice(0, 255);
  } catch {
    return trimmed.slice(0, 255);
  }
}

export function detectSearchMetodo(termo: string): CheckinMetodo {
  const digits = onlyDigits(termo);
  if (isValidCpf(digits)) return "CPF";
  if (termo.includes("@")) return "EMAIL";
  return "NOME";
}

export { todayInEventTimezone };
