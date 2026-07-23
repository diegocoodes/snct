import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { cookies, headers } from "next/headers";

import { query } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import {
  getRoleByCodigo,
  ROLE_CODIGO_TO_AUTH,
  requiresMfa,
} from "@/lib/roles";
import type {
  PublicUser,
  RoleCodigo,
  SessionData,
  StoredUser,
  UserRole,
} from "@/lib/snct-types";

const SESSION_COOKIE = "snct_session";
const SESSION_DAYS = 7;

type UsuarioRow = {
  id: number | bigint | string;
  role_id: number;
  nome_completo: string;
  email: string;
  telefone: string;
  cpf: string;
  senha_hash: string;
  data_nascimento: Date | string;
  foto: string | null;
  aceitou_direito_imagem: number | boolean;
  data_aceite_direito_imagem: Date | null;
  qr_code_hash: string;
  ativo: number | boolean;
  created_at: Date;
  role_codigo: RoleCodigo;
  role_nome: string;
};

function toId(value: number | bigint | string) {
  return String(value);
}

function birthIso(value: Date | string) {
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  return String(value).slice(0, 10);
}

function ageFromBirth(value: Date | string) {
  const iso = birthIso(value);
  const [y, m, d] = iso.split("-").map(Number);
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) {
    age -= 1;
  }
  return age;
}

export function mapUsuarioRow(row: UsuarioRow): StoredUser {
  const role = ROLE_CODIGO_TO_AUTH[row.role_codigo];
  const qr = row.qr_code_hash;
  return {
    id: toId(row.id),
    name: row.nome_completo,
    email: row.email,
    role,
    roleId: row.role_id,
    roleCodigo: row.role_codigo,
    roleNome: row.role_nome,
    telefone: row.telefone,
    cpf: row.cpf,
    dataNascimento: birthIso(row.data_nascimento),
    foto: row.foto ?? undefined,
    aceitouDireitoImagem: Boolean(row.aceitou_direito_imagem),
    dataAceiteDireitoImagem: row.data_aceite_direito_imagem
      ? new Date(row.data_aceite_direito_imagem).toISOString()
      : undefined,
    qrCodeHash: qr,
    visitorHash: qr,
    ativo: Boolean(row.ativo),
    age: ageFromBirth(row.data_nascimento),
    emailVerified: true,
    twoFactorEnabled: false,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

const userSelect = `
  SELECT u.id, u.role_id, u.nome_completo, u.email, u.telefone, u.cpf,
         u.senha_hash, u.data_nascimento, u.foto, u.aceitou_direito_imagem,
         u.data_aceite_direito_imagem, u.qr_code_hash, u.ativo, u.created_at,
         r.codigo AS role_codigo, r.nome AS role_nome
  FROM usuarios u
  INNER JOIN roles r ON r.id = u.role_id
`;

export async function findUsuarioByEmail(email: string) {
  const result = await query<UsuarioRow>(
    `${userSelect} WHERE lower(u.email) = lower($1) LIMIT 1`,
    [email.trim()],
  );
  return result.rows[0] ?? null;
}

export async function findUsuarioById(id: string) {
  const result = await query<UsuarioRow>(
    `${userSelect} WHERE u.id = $1 LIMIT 1`,
    [id],
  );
  return result.rows[0] ?? null;
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createVisitorHash() {
  return randomBytes(32).toString("base64url");
}

export function toPublicUser(user: PublicUser): PublicUser {
  return {
    ...user,
    visitorHash: user.qrCodeHash ?? user.visitorHash,
    qrCodeHash: user.qrCodeHash ?? user.visitorHash,
  };
}

export async function getSession(): Promise<SessionData | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const result = await query<{
    usuario_id: number | bigint | string;
    expires_at: Date;
    nome_completo: string;
    email: string;
    role_codigo: RoleCodigo;
    ativo: number | boolean;
  }>(
    `SELECT s.usuario_id, s.expires_at, u.nome_completo, u.email, u.ativo,
            r.codigo AS role_codigo
     FROM sessoes s
     INNER JOIN usuarios u ON u.id = s.usuario_id
     INNER JOIN roles r ON r.id = u.role_id
     WHERE s.token_hash = $1
     LIMIT 1`,
    [hashToken(token)],
  );
  const row = result.rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;
  if (!Boolean(row.ativo)) return null;

  return {
    userId: toId(row.usuario_id),
    name: row.nome_completo,
    email: row.email,
    role: ROLE_CODIGO_TO_AUTH[row.role_codigo],
    emailVerified: true,
    mfaEnabled: true,
    expiresAt: new Date(row.expires_at).getTime(),
  };
}

export async function requireRole(...roles: UserRole[]) {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) return null;
  void requiresMfa;
  void headers;
  return session;
}

export async function ensureBootstrapAdmin() {
  const email = process.env.SNCT_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SNCT_ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await findUsuarioByEmail(email);
  if (existing) {
    if (existing.role_codigo !== "ADMINISTRADOR") {
      throw new Error(
        "SNCT_ADMIN_EMAIL já pertence a uma conta não administrativa.",
      );
    }
    return;
  }

  const role = await getRoleByCodigo("ADMINISTRADOR");
  if (!role) throw new Error("Role ADMINISTRADOR não encontrada.");

  const senhaHash = await hashPassword(password);
  await query(
    `INSERT INTO usuarios
      (role_id, nome_completo, email, telefone, cpf, senha_hash,
       data_nascimento, aceitou_direito_imagem, data_aceite_direito_imagem,
       qr_code_hash, ativo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW(3), $8, TRUE)`,
    [
      role.id,
      "Administrador SNCT",
      email,
      "00000000000",
      "00000000000",
      senhaHash,
      "1990-01-01",
      createVisitorHash(),
    ],
  );
}

export { verifyPassword, hashPassword };
