import { createHash, randomBytes, randomUUID } from "node:crypto";
import path from "node:path";

import { fileTypeFromBuffer } from "file-type";

import { assertFileIsClean } from "@/lib/clamav";
import { isValidCpf, onlyDigits } from "@/lib/cpf";
import { query, transaction, clientExecute } from "@/lib/db";
import { decryptFile, encryptFile } from "@/lib/encryption";
import { hashPassword } from "@/lib/password";
import { getRoleByCodigo } from "@/lib/roles";
import {
  createQrCodeHash,
  parseBirthDate,
  saveUsuarioFoto,
} from "@/lib/usuarios";

export type ProfessorEscola = {
  id: string;
  professorUsuarioId: string;
  nome: string;
  cidade: string | null;
  createdAt: string;
};

export type ProfessorTema = {
  id: string;
  escolaId: string;
  titulo: string;
  descricao: string | null;
  createdAt: string;
  alunosCount: number;
};

export type ProfessorAlunoDocumento = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
};

export type ProfessorAluno = {
  id: string;
  temaId: string;
  usuarioId: string;
  nomeCompleto: string;
  email: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
  age: number;
  foto?: string;
  qrCodeHash: string;
  documentos: ProfessorAlunoDocumento[];
  createdAt: string;
};

export type CreateAlunoInput = {
  nomeCompleto: string;
  email: string;
  telefone: string;
  cpf: string;
  dataNascimento: string;
  aceitouDireitoImagem: boolean;
  privacyConsent: boolean;
  guardianConsent?: boolean;
  fotoBuffer?: Buffer | null;
  autorizacaoFiles?: File[];
};

const maximumDocumentSize = 10 * 1024 * 1024;
const allowedDocumentTypes: Record<string, Set<string>> = {
  ".pdf": new Set(["application/pdf"]),
  ".doc": new Set(["application/x-cfb"]),
  ".docx": new Set([
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  ".jpg": new Set(["image/jpeg"]),
  ".jpeg": new Set(["image/jpeg"]),
  ".png": new Set(["image/png"]),
  ".webp": new Set(["image/webp"]),
};

function toId(value: number | bigint | string) {
  return String(value);
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function ageFromIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number);
  const now = new Date();
  let age = now.getUTCFullYear() - year;
  const monthDiff = now.getUTCMonth() + 1 - month;
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < day)) age -= 1;
  return age;
}

async function saveAutorizacaoDocumento(
  alunoRowId: string,
  file: File,
) {
  const originalName = path.basename(file.name).slice(0, 140);
  const extension = path.extname(originalName).toLowerCase();
  if (
    !originalName ||
    !allowedDocumentTypes[extension] ||
    file.size < 1 ||
    file.size > maximumDocumentSize
  ) {
    throw new Error(
      "Use PDF, DOC, DOCX, JPG, PNG ou WebP de até 10 MB para a autorização.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  const mimeType = detected?.mime ?? "";
  if (!allowedDocumentTypes[extension].has(mimeType)) {
    throw new Error(
      "O conteúdo do arquivo de autorização não corresponde à extensão.",
    );
  }
  await assertFileIsClean(buffer);

  const id = `aluno-doc-${randomUUID()}`;
  const storageName = `${id}${extension}`;
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const encrypted = encryptFile(buffer);

  await query(
    `INSERT INTO professor_aluno_documentos
      (id, professor_tema_aluno_id, original_name, storage_name, mime_type,
       byte_size, sha256, scan_status, encryption_iv, encryption_tag,
       encryption_key_version, file_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'clean', $8, $9, $10, $11)`,
    [
      id,
      alunoRowId,
      originalName,
      storageName,
      mimeType,
      buffer.byteLength,
      sha256,
      encrypted.iv,
      encrypted.tag,
      encrypted.keyVersion,
      encrypted.encrypted,
    ],
  );

  return {
    id,
    name: originalName,
    mimeType,
    size: buffer.byteLength,
  } satisfies ProfessorAlunoDocumento;
}

export async function getEscolaByProfessor(professorId: string) {
  const result = await query<{
    id: number;
    professor_usuario_id: number;
    nome: string;
    cidade: string | null;
    created_at: Date;
  }>(
    `SELECT id, professor_usuario_id, nome, cidade, created_at
     FROM professor_escolas
     WHERE professor_usuario_id = $1
     LIMIT 1`,
    [professorId],
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: toId(row.id),
    professorUsuarioId: toId(row.professor_usuario_id),
    nome: row.nome,
    cidade: row.cidade,
    createdAt: new Date(row.created_at).toISOString(),
  } satisfies ProfessorEscola;
}

const ESCOLA_CIDADE = "Paulista";

export async function upsertEscola(
  professorId: string,
  input: { nome: string; cidade?: string },
) {
  const nome = input.nome.trim();
  const cidade = ESCOLA_CIDADE;
  if (nome.length < 2) {
    return { ok: false as const, status: 400, error: "Informe o nome da escola." };
  }
  if (
    input.cidade &&
    input.cidade.trim().toLowerCase() !== ESCOLA_CIDADE.toLowerCase()
  ) {
    return {
      ok: false as const,
      status: 400,
      error: "A cidade da escola deve ser Paulista.",
    };
  }

  const existing = await getEscolaByProfessor(professorId);
  if (existing) {
    await query(
      `UPDATE professor_escolas
       SET nome = $1, cidade = $2
       WHERE id = $3`,
      [nome, cidade, existing.id],
    );
    return {
      ok: true as const,
      escola: { ...existing, nome, cidade },
    };
  }

  await query(
    `INSERT INTO professor_escolas (professor_usuario_id, nome, cidade)
     VALUES ($1, $2, $3)`,
    [professorId, nome, cidade],
  );
  const escola = await getEscolaByProfessor(professorId);
  if (!escola) {
    return { ok: false as const, status: 500, error: "Falha ao salvar a escola." };
  }
  return { ok: true as const, escola };
}

export async function deleteEscola(professorId: string) {
  const escola = await getEscolaByProfessor(professorId);
  if (!escola) {
    return { ok: false as const, status: 404, error: "Escola não encontrada." };
  }

  const alunos = await query<{ usuario_id: number }>(
    `SELECT a.usuario_id
     FROM professor_tema_alunos a
     INNER JOIN professor_temas t ON t.id = a.tema_id
     WHERE t.escola_id = $1`,
    [escola.id],
  );

  await query(`DELETE FROM professor_escolas WHERE id = $1`, [escola.id]);
  for (const aluno of alunos.rows) {
    await query(`DELETE FROM usuarios WHERE id = $1`, [aluno.usuario_id]).catch(
      () => undefined,
    );
  }
  return { ok: true as const };
}

export async function listTemas(escolaId: string) {
  const result = await query<{
    id: number;
    escola_id: number;
    titulo: string;
    descricao: string | null;
    created_at: Date;
    alunos_count: number;
  }>(
    `SELECT t.id, t.escola_id, t.titulo, t.descricao, t.created_at,
            COUNT(a.id) AS alunos_count
     FROM professor_temas t
     LEFT JOIN professor_tema_alunos a ON a.tema_id = t.id
     WHERE t.escola_id = $1
     GROUP BY t.id, t.escola_id, t.titulo, t.descricao, t.created_at
     ORDER BY t.created_at DESC`,
    [escolaId],
  );

  return result.rows.map(
    (row) =>
      ({
        id: toId(row.id),
        escolaId: toId(row.escola_id),
        titulo: row.titulo,
        descricao: row.descricao,
        createdAt: new Date(row.created_at).toISOString(),
        alunosCount: Number(row.alunos_count ?? 0),
      }) satisfies ProfessorTema,
  );
}

export async function createTema(
  escolaId: string,
  input: { titulo: string; descricao?: string },
) {
  const titulo = input.titulo.trim();
  const descricao = input.descricao?.trim() || null;
  if (titulo.length < 2) {
    return { ok: false as const, status: 400, error: "Informe o título do projeto." };
  }

  await query(
    `INSERT INTO professor_temas (escola_id, titulo, descricao)
     VALUES ($1, $2, $3)`,
    [escolaId, titulo, descricao],
  );
  const temas = await listTemas(escolaId);
  return { ok: true as const, tema: temas[0] };
}

export async function updateTema(
  temaId: string,
  professorId: string,
  input: { titulo: string; descricao?: string },
) {
  const owned = await assertTemaOwnedByProfessor(temaId, professorId);
  if (!owned) {
    return { ok: false as const, status: 404, error: "Projeto não encontrado." };
  }

  const titulo = input.titulo.trim();
  const descricao = input.descricao?.trim() || null;
  if (titulo.length < 2) {
    return { ok: false as const, status: 400, error: "Informe o título do projeto." };
  }

  await query(
    `UPDATE professor_temas
     SET titulo = $1, descricao = $2
     WHERE id = $3`,
    [titulo, descricao, temaId],
  );
  return { ok: true as const };
}

export async function deleteTema(temaId: string, professorId: string) {
  const owned = await query<{ id: number }>(
    `SELECT t.id
     FROM professor_temas t
     INNER JOIN professor_escolas e ON e.id = t.escola_id
     WHERE t.id = $1 AND e.professor_usuario_id = $2
     LIMIT 1`,
    [temaId, professorId],
  );
  if (!owned.rows[0]) {
    return { ok: false as const, status: 404, error: "Projeto não encontrado." };
  }

  const alunos = await query<{ usuario_id: number }>(
    `SELECT usuario_id FROM professor_tema_alunos WHERE tema_id = $1`,
    [temaId],
  );
  await query(`DELETE FROM professor_temas WHERE id = $1`, [temaId]);
  for (const aluno of alunos.rows) {
    await query(`DELETE FROM usuarios WHERE id = $1`, [aluno.usuario_id]).catch(
      () => undefined,
    );
  }
  return { ok: true as const };
}

async function listDocumentos(alunoRowId: string) {
  const result = await query<{
    id: string;
    original_name: string;
    mime_type: string;
    byte_size: number;
  }>(
    `SELECT id, original_name, mime_type, byte_size
     FROM professor_aluno_documentos
     WHERE professor_tema_aluno_id = $1
     ORDER BY created_at ASC`,
    [alunoRowId],
  );
  return result.rows.map(
    (row) =>
      ({
        id: row.id,
        name: row.original_name,
        mimeType: row.mime_type,
        size: row.byte_size,
      }) satisfies ProfessorAlunoDocumento,
  );
}

export async function listAlunos(temaId: string) {
  const result = await query<{
    id: number;
    tema_id: number;
    usuario_id: number;
    nome_completo: string;
    email: string;
    telefone: string;
    cpf: string;
    data_nascimento: Date | string;
    foto: string | null;
    qr_code_hash: string;
    created_at: Date;
  }>(
    `SELECT a.id, a.tema_id, a.usuario_id, a.nome_completo,
            u.email, u.telefone, u.cpf, u.data_nascimento, u.foto,
            u.qr_code_hash, a.created_at
     FROM professor_tema_alunos a
     INNER JOIN usuarios u ON u.id = a.usuario_id
     WHERE a.tema_id = $1
     ORDER BY a.created_at DESC`,
    [temaId],
  );

  const alunos: ProfessorAluno[] = [];
  for (const row of result.rows) {
    const dataNascimento =
      row.data_nascimento instanceof Date
        ? row.data_nascimento.toISOString().slice(0, 10)
        : String(row.data_nascimento).slice(0, 10);
    alunos.push({
      id: toId(row.id),
      temaId: toId(row.tema_id),
      usuarioId: toId(row.usuario_id),
      nomeCompleto: row.nome_completo,
      email: row.email,
      telefone: row.telefone,
      cpf: row.cpf,
      dataNascimento,
      age: ageFromIso(dataNascimento),
      foto: row.foto ?? undefined,
      qrCodeHash: row.qr_code_hash,
      documentos: await listDocumentos(toId(row.id)),
      createdAt: new Date(row.created_at).toISOString(),
    });
  }
  return alunos;
}

export async function assertTemaOwnedByProfessor(
  temaId: string,
  professorId: string,
) {
  const result = await query<{ id: number; escola_id: number }>(
    `SELECT t.id, t.escola_id
     FROM professor_temas t
     INNER JOIN professor_escolas e ON e.id = t.escola_id
     WHERE t.id = $1 AND e.professor_usuario_id = $2
     LIMIT 1`,
    [temaId, professorId],
  );
  return result.rows[0] ? { id: toId(result.rows[0].id) } : null;
}

export async function createAluno(
  temaId: string,
  professorId: string,
  input: CreateAlunoInput,
) {
  const owned = await assertTemaOwnedByProfessor(temaId, professorId);
  if (!owned) {
    return { ok: false as const, status: 404, error: "Projeto não encontrado." };
  }

  const nomeCompleto = input.nomeCompleto.trim();
  const email = input.email.trim().toLowerCase();
  const telefone = onlyDigits(input.telefone);
  const cpf = onlyDigits(input.cpf);
  const birth = parseBirthDate(input.dataNascimento.trim());

  if (nomeCompleto.length < 2) {
    return { ok: false as const, status: 400, error: "Informe o nome completo." };
  }
  if (!isEmail(email)) {
    return { ok: false as const, status: 400, error: "Informe um e-mail válido." };
  }
  if (telefone.length < 10 || telefone.length > 11) {
    return { ok: false as const, status: 400, error: "Informe um telefone válido." };
  }
  if (!isValidCpf(cpf)) {
    return { ok: false as const, status: 400, error: "Informe um CPF válido." };
  }
  if (!birth) {
    return {
      ok: false as const,
      status: 400,
      error: "Informe uma data de nascimento válida.",
    };
  }
  if (!input.aceitouDireitoImagem) {
    return {
      ok: false as const,
      status: 400,
      error: "É obrigatório aceitar o direito de uso de imagem.",
    };
  }
  if (!input.privacyConsent) {
    return {
      ok: false as const,
      status: 400,
      error: "Aceite o aviso de privacidade para continuar.",
    };
  }
  if (birth.age < 18 && !input.guardianConsent) {
    return {
      ok: false as const,
      status: 400,
      error: "O consentimento do responsável é obrigatório para menores.",
    };
  }
  if (birth.age < 18 && (!input.autorizacaoFiles || input.autorizacaoFiles.length < 1)) {
    return {
      ok: false as const,
      status: 400,
      error:
        "Anexe o documento de autorização dos pais/responsáveis para alunos menores.",
    };
  }

  const role = await getRoleByCodigo("ALUNO");
  if (!role) {
    return { ok: false as const, status: 500, error: "Função ALUNO não configurada." };
  }

  const existingEmail = await query<{ id: number }>(
    "SELECT id FROM usuarios WHERE lower(email) = $1 LIMIT 1",
    [email],
  );
  if (existingEmail.rows[0]) {
    return { ok: false as const, status: 409, error: "Este e-mail já está em uso." };
  }
  const existingCpf = await query<{ id: number }>(
    "SELECT id FROM usuarios WHERE cpf = $1 LIMIT 1",
    [cpf],
  );
  if (existingCpf.rows[0]) {
    return { ok: false as const, status: 409, error: "Este CPF já está em uso." };
  }

  const qrCodeHash = createQrCodeHash();
  const senhaHash = await hashPassword(`A!${randomBytes(24).toString("base64url")}`);

  let userId = "";
  let alunoRowId = "";

  try {
    const created = await transaction(async (client) => {
      const inserted = await clientExecute(
        client,
        `INSERT INTO usuarios
          (role_id, nome_completo, email, telefone, cpf, senha_hash,
           data_nascimento, aceitou_direito_imagem, data_aceite_direito_imagem,
           qr_code_hash, ativo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW(3), $8, TRUE)`,
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
      const id = inserted.insertId;
      if (!id) throw new Error("Falha ao criar aluno.");

      const link = await clientExecute(
        client,
        `INSERT INTO professor_tema_alunos (tema_id, usuario_id, nome_completo)
         VALUES ($1, $2, $3)`,
        [temaId, id, nomeCompleto],
      );
      return { userId: toId(id), alunoRowId: toId(link.insertId) };
    });
    userId = created.userId;
    alunoRowId = created.alunoRowId;

    if (input.fotoBuffer && input.fotoBuffer.byteLength > 0) {
      const fotoPath = await saveUsuarioFoto(userId, input.fotoBuffer);
      await query(`UPDATE usuarios SET foto = $2 WHERE id = $1`, [
        userId,
        fotoPath,
      ]);
    }

    if (input.autorizacaoFiles) {
      for (const file of input.autorizacaoFiles) {
        await saveAutorizacaoDocumento(alunoRowId, file);
      }
    }
  } catch (error) {
    if (userId) {
      await query(`DELETE FROM usuarios WHERE id = $1`, [userId]).catch(
        () => undefined,
      );
    }
    const message =
      error instanceof Error ? error.message : "Não foi possível cadastrar o aluno.";
    return { ok: false as const, status: 400, error: message };
  }

  const alunos = await listAlunos(temaId);
  const aluno = alunos.find((item) => item.usuarioId === userId) ?? null;
  return { ok: true as const, aluno, qrCodeHash };
}

export async function deleteAluno(alunoId: string, professorId: string) {
  const row = await query<{ id: number; usuario_id: number }>(
    `SELECT a.id, a.usuario_id
     FROM professor_tema_alunos a
     INNER JOIN professor_temas t ON t.id = a.tema_id
     INNER JOIN professor_escolas e ON e.id = t.escola_id
     WHERE a.id = $1 AND e.professor_usuario_id = $2
     LIMIT 1`,
    [alunoId, professorId],
  );
  if (!row.rows[0]) {
    return { ok: false as const, status: 404, error: "Aluno não encontrado." };
  }

  const usuarioId = row.rows[0].usuario_id;
  await query(`DELETE FROM usuarios WHERE id = $1`, [usuarioId]);
  return { ok: true as const };
}

export async function getAlunoDocumentoForProfessor(
  documentId: string,
  professorId: string,
) {
  const result = await query<{
    id: string;
    original_name: string;
    mime_type: string;
    file_data: Buffer;
    encryption_iv: Buffer;
    encryption_tag: Buffer;
    encryption_key_version: number;
  }>(
    `SELECT d.id, d.original_name, d.mime_type, d.file_data,
            d.encryption_iv, d.encryption_tag, d.encryption_key_version
     FROM professor_aluno_documentos d
     INNER JOIN professor_tema_alunos a ON a.id = d.professor_tema_aluno_id
     INNER JOIN professor_temas t ON t.id = a.tema_id
     INNER JOIN professor_escolas e ON e.id = t.escola_id
     WHERE d.id = $1 AND e.professor_usuario_id = $2 AND d.scan_status = 'clean'
     LIMIT 1`,
    [documentId, professorId],
  );
  const row = result.rows[0];
  if (!row) return null;
  const file = decryptFile(
    row.file_data,
    row.encryption_iv,
    row.encryption_tag,
    row.encryption_key_version,
  );
  return {
    id: row.id,
    name: row.original_name,
    mimeType: row.mime_type,
    file,
  };
}

export async function getProfessorPanel(professorId: string) {
  const escola = await getEscolaByProfessor(professorId);
  if (!escola) {
    return {
      escola: null,
      temas: [] as ProfessorTema[],
      alunosByTema: {} as Record<string, ProfessorAluno[]>,
    };
  }
  const temas = await listTemas(escola.id);
  const alunosByTema: Record<string, ProfessorAluno[]> = {};
  for (const tema of temas) {
    alunosByTema[tema.id] = await listAlunos(tema.id);
  }
  return { escola, temas, alunosByTema };
}
