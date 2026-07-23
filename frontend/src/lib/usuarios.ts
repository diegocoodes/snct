import { randomBytes } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { fileTypeFromBuffer } from "file-type";

import { mapUsuarioRow, createVisitorHash } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { assertFileIsClean } from "@/lib/clamav";
import { isValidCpf, onlyDigits } from "@/lib/cpf";
import { query, transaction, clientQuery } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import {
  getRoleByCodigo,
  PUBLIC_REGISTRATION_ROLES,
  ROLE_CODIGO_TO_AUTH,
} from "@/lib/roles";
import type { RoleCodigo, StoredUser } from "@/lib/snct-types";

const uploadsRoot =
  process.env.SNCT_UPLOADS_DIR ??
  path.join(process.cwd(), "uploads", "fotos");

export type RegistroUsuarioInput = {
  nomeCompleto: string;
  email: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
  senha: string;
  aceitouDireitoImagem: boolean;
  privacyConsent?: boolean;
  guardianConsent?: boolean;
  fotoBuffer?: Buffer | null;
  fotoFilename?: string | null;
};

export type RegistroResult =
  | { ok: true; user: StoredUser; qrCodeHash: string }
  | { ok: false; status: number; error: string };

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() + 1 !== month ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  const now = new Date();
  let age = now.getUTCFullYear() - year;
  const monthDiff = now.getUTCMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < day)) age -= 1;
  if (age < 5 || age > 120) return null;
  return { iso: value, age };
}

export function createQrCodeHash() {
  return randomBytes(32).toString("base64url");
}

async function saveFoto(userId: string, buffer: Buffer) {
  const detected = await fileTypeFromBuffer(buffer);
  const mime = detected?.mime ?? "";
  const allowed = new Set(["image/jpeg", "image/png", "image/webp"]);
  if (!allowed.has(mime) || buffer.byteLength < 1 || buffer.byteLength > 5 * 1024 * 1024) {
    throw new Error("Envie uma foto JPEG, PNG ou WebP de até 5 MB.");
  }
  await assertFileIsClean(buffer);
  await mkdir(uploadsRoot, { recursive: true });
  const ext =
    mime === "image/png" ? ".png" : mime === "image/webp" ? ".webp" : ".jpg";
  const storageName = `${userId}-${createQrCodeHash().slice(0, 12)}${ext}`;
  await writeFile(path.join(uploadsRoot, storageName), buffer);
  return `/api/uploads/fotos/${storageName}`;
}

export function assertPublicRegistrationRole(
  codigo: string,
): asserts codigo is (typeof PUBLIC_REGISTRATION_ROLES)[number] {
  if (!(PUBLIC_REGISTRATION_ROLES as readonly string[]).includes(codigo)) {
    throw new Error("Perfil de inscrição inválido.");
  }
}

export async function registrarUsuario(
  dados: RegistroUsuarioInput,
  rolePermitida: RoleCodigo,
  request?: Request,
): Promise<RegistroResult> {
  assertPublicRegistrationRole(rolePermitida);

  const nomeCompleto = dados.nomeCompleto.trim();
  const email = dados.email.trim().toLowerCase();
  const telefone = onlyDigits(dados.telefone);
  const cpf = onlyDigits(dados.cpf);
  const birth = parseBirthDate(dados.dataNascimento.trim());
  const senha = dados.senha;

  if (nomeCompleto.length < 2) {
    return { ok: false, status: 400, error: "Informe o nome completo." };
  }
  if (!isEmail(email)) {
    return { ok: false, status: 400, error: "Informe um e-mail válido." };
  }
  if (telefone.length < 10 || telefone.length > 11) {
    return { ok: false, status: 400, error: "Informe um telefone válido." };
  }
  if (!isValidCpf(cpf)) {
    return { ok: false, status: 400, error: "Informe um CPF válido." };
  }
  if (!birth) {
    return {
      ok: false,
      status: 400,
      error: "Informe uma data de nascimento válida.",
    };
  }
  if (!dados.aceitouDireitoImagem) {
    return {
      ok: false,
      status: 400,
      error: "É obrigatório aceitar o direito de uso de imagem.",
    };
  }
  if (dados.privacyConsent === false) {
    return {
      ok: false,
      status: 400,
      error: "Aceite o aviso de privacidade para continuar.",
    };
  }
  if (birth.age < 18 && !dados.guardianConsent) {
    return {
      ok: false,
      status: 400,
      error: "O consentimento do responsável é obrigatório para menores.",
    };
  }
  if (senha.length < 12) {
    return {
      ok: false,
      status: 400,
      error: "Use uma senha com pelo menos 12 caracteres.",
    };
  }

  const role = await getRoleByCodigo(rolePermitida);
  if (!role) {
    return { ok: false, status: 500, error: "Função não configurada." };
  }

  const existingEmail = await query<{ id: number }>(
    "SELECT id FROM usuarios WHERE lower(email) = $1 LIMIT 1",
    [email],
  );
  if (existingEmail.rows[0]) {
    return { ok: false, status: 409, error: "Este e-mail já está em uso." };
  }
  const existingCpf = await query<{ id: number }>(
    "SELECT id FROM usuarios WHERE cpf = $1 LIMIT 1",
    [cpf],
  );
  if (existingCpf.rows[0]) {
    return { ok: false, status: 409, error: "Este CPF já está em uso." };
  }

  const qrCodeHash = createQrCodeHash();
  const senhaHash = await hashPassword(senha);

  await query(
    `INSERT INTO usuarios
      (role_id, nome_completo, email, telefone, cpf, senha_hash,
       data_nascimento, foto, aceitou_direito_imagem, data_aceite_direito_imagem,
       qr_code_hash, ativo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NULL, TRUE, NOW(3), $8, TRUE)`,
    [
      role.id,
      nomeCompleto,
      email,
      telefone,
      cpf,
      senhaHash,
      birth.iso,
      qrCodeHash,
    ],
  );

  const created = await query<{ id: number }>(
    "SELECT id FROM usuarios WHERE email = $1 LIMIT 1",
    [email],
  );
  const userId = String(created.rows[0]?.id ?? "");
  if (!userId) {
    return { ok: false, status: 400, error: "Não foi possível criar o usuário." };
  }

  let fotoPath: string | null = null;
  try {
    if (dados.fotoBuffer && dados.fotoBuffer.byteLength > 0) {
      fotoPath = await saveFoto(userId, dados.fotoBuffer);
      await query(`UPDATE usuarios SET foto = $2 WHERE id = $1`, [
        userId,
        fotoPath,
      ]);
    }
  } catch (error) {
    await query("DELETE FROM usuarios WHERE id = $1", [userId]).catch(() => {});
    throw error;
  }

  if (request) {
    await recordAuditEvent(request, {
      actorId: userId,
      actorRole: ROLE_CODIGO_TO_AUTH[rolePermitida],
      action: "auth.register",
      entity: "usuario",
      entityId: userId,
      metadata: { role: rolePermitida, minor: birth.age < 18 },
    });
  }

  return {
    ok: true,
    qrCodeHash,
    user: {
      id: userId,
      name: nomeCompleto,
      email,
      role: ROLE_CODIGO_TO_AUTH[rolePermitida],
      roleId: role.id,
      roleCodigo: rolePermitida,
      telefone,
      cpf,
      dataNascimento: birth.iso,
      foto: fotoPath ?? undefined,
      aceitouDireitoImagem: true,
      qrCodeHash,
      visitorHash: qrCodeHash,
      ativo: true,
      age: birth.age,
      createdAt: new Date().toISOString(),
    },
  };
}

export async function changeUserRole(params: {
  usuarioId: string;
  novaRoleCodigo: RoleCodigo;
  alteradoPorUsuarioId: string;
  motivo?: string;
  request?: Request;
}) {
  const novaRole = await getRoleByCodigo(params.novaRoleCodigo);
  if (!novaRole) throw new Error("Função inválida.");

  const current = await query<{
    id: number;
    role_id: number;
    email: string;
    codigo: RoleCodigo;
  }>(
    `SELECT u.id, u.role_id, u.email, r.codigo
     FROM usuarios u INNER JOIN roles r ON r.id = u.role_id
     WHERE u.id = $1 LIMIT 1`,
    [params.usuarioId],
  );
  const user = current.rows[0];
  if (!user) throw new Error("Usuário não encontrado.");

  const adminEmail = process.env.SNCT_ADMIN_EMAIL?.trim().toLowerCase();
  if (
    adminEmail &&
    user.email.toLowerCase() === adminEmail &&
    params.novaRoleCodigo !== "ADMINISTRADOR"
  ) {
    throw new Error("Não é permitido alterar a função do administrador inicial.");
  }

  await query(`UPDATE usuarios SET role_id = $2, updated_at = NOW(3) WHERE id = $1`, [
    params.usuarioId,
    novaRole.id,
  ]);

  if (params.request) {
    await recordAuditEvent(params.request, {
      actorId: params.alteradoPorUsuarioId,
      actorRole: "admin",
      action:
        params.novaRoleCodigo === "STAFF"
          ? "user.promote_staff"
          : params.novaRoleCodigo === "ADMINISTRADOR"
            ? "user.create_admin"
            : "user.role_change",
      entity: "usuario",
      entityId: params.usuarioId,
      dadosAnteriores: { roleId: user.role_id, role: user.codigo },
      dadosNovos: { roleId: novaRole.id, role: params.novaRoleCodigo },
      metadata: { motivo: params.motivo ?? null },
    });
  }

  return {
    role: ROLE_CODIGO_TO_AUTH[params.novaRoleCodigo],
    roleId: novaRole.id,
    roleCodigo: params.novaRoleCodigo,
  };
}

export async function setUserActive(params: {
  usuarioId: string;
  ativo: boolean;
  alteradoPorUsuarioId: string;
  request?: Request;
}) {
  const current = await query<{ id: number; ativo: number | boolean }>(
    "SELECT id, ativo FROM usuarios WHERE id = $1 LIMIT 1",
    [params.usuarioId],
  );
  const user = current.rows[0];
  if (!user) throw new Error("Usuário não encontrado.");

  await query(`UPDATE usuarios SET ativo = $2, updated_at = NOW(3) WHERE id = $1`, [
    params.usuarioId,
    params.ativo,
  ]);

  if (params.request) {
    await recordAuditEvent(params.request, {
      actorId: params.alteradoPorUsuarioId,
      actorRole: "admin",
      action: params.ativo ? "user.activate" : "user.deactivate",
      entity: "usuario",
      entityId: params.usuarioId,
      dadosAnteriores: { ativo: Boolean(user.ativo) },
      dadosNovos: { ativo: params.ativo },
    });
  }
}

export async function listRoleChanges(usuarioId: string) {
  const result = await query<{
    id: number;
    usuario_responsavel_id: number | null;
    dados_anteriores: Record<string, unknown> | null;
    dados_novos: Record<string, unknown> | null;
    created_at: Date;
  }>(
    `SELECT id, usuario_responsavel_id, dados_anteriores, dados_novos, created_at
     FROM auditoria
     WHERE entidade = 'usuario' AND entidade_id = $1
       AND acao IN ('user.role_change', 'user.promote_staff', 'user.create_admin')
     ORDER BY created_at DESC
     LIMIT 100`,
    [usuarioId],
  );

  return result.rows.map((row) => ({
    id: row.id,
    usuarioId,
    roleAnteriorId: Number(row.dados_anteriores?.roleId ?? 0) || null,
    roleNovaId: Number(row.dados_novos?.roleId ?? 0) || 0,
    roleAnteriorCodigo: (row.dados_anteriores?.role as RoleCodigo) ?? null,
    roleNovaCodigo: (row.dados_novos?.role as RoleCodigo) ?? undefined,
    alteradoPorUsuarioId: row.usuario_responsavel_id
      ? String(row.usuario_responsavel_id)
      : null,
    motivo: null,
    createdAt: row.created_at.toISOString(),
  }));
}

export { createVisitorHash, mapUsuarioRow };
