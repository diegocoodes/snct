import { mapUsuarioRow } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { isValidCpf, onlyDigits } from "@/lib/cpf";
import { query } from "@/lib/db";
import {
  assertTrustedMutation,
  enforceRateLimit,
  securityErrorResponse,
} from "@/lib/request-security";
import type { RoleCodigo } from "@/lib/snct-types";

type UsuarioCredencialRow = {
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
  checkin_hoje: number | boolean | null;
};

export async function POST_VISITANTE_CPF(request: Request) {
  try {
    assertTrustedMutation(request);
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const cpf = onlyDigits(String(body?.cpf ?? ""));

    await enforceRateLimit({
      request,
      scope: "credencial-cpf",
      identifier: cpf || "invalid",
      limit: 8,
      windowSeconds: 60,
    });

    if (!cpf || !isValidCpf(cpf)) {
      return Response.json(
        { error: "Informe um CPF válido." },
        { status: 400 },
      );
    }

    const result = await query<UsuarioCredencialRow>(
      `SELECT u.id, u.role_id, u.nome_completo, u.email, u.telefone, u.cpf,
              u.senha_hash, u.data_nascimento, u.foto, u.aceitou_direito_imagem,
              u.data_aceite_direito_imagem, u.qr_code_hash, u.ativo, u.created_at,
              r.codigo AS role_codigo, r.nome AS role_nome,
              EXISTS(
                SELECT 1 FROM checkins c
                WHERE c.usuario_id = u.id AND c.data_checkin = CURDATE()
              ) AS checkin_hoje
       FROM usuarios u
       INNER JOIN roles r ON r.id = u.role_id
       WHERE u.cpf = $1
         AND r.codigo IN ('VISITANTE', 'ALUNO', 'PROFESSOR', 'AVALIADOR')
         AND u.ativo = TRUE
       LIMIT 1`,
      [cpf],
    );

    const row = result.rows[0];
    if (!row) {
      await recordAuditEvent(request, {
        action: "credencial.cpf_lookup",
        entity: "usuario",
        outcome: "failure",
      }).catch(() => {});
      return Response.json(
        { error: "Nenhuma credencial encontrada para este CPF." },
        { status: 404 },
      );
    }

    const user = mapUsuarioRow(row);
    if (Boolean(row.checkin_hoje)) {
      user.checkedInAt = new Date().toISOString();
      user.checkinHoje = true;
    }

    await recordAuditEvent(request, {
      action: "credencial.cpf_lookup",
      entity: "usuario",
      entityId: user.id,
      outcome: "success",
      actorRole: user.role,
    }).catch(() => {});

    return Response.json({
      visitor: {
        id: user.id,
        name: user.name,
        role: user.role,
        roleCodigo: user.roleCodigo,
        roleNome: user.roleNome,
        dataNascimento: user.dataNascimento,
        age: user.age,
        qrCodeHash: user.qrCodeHash,
        visitorHash: user.visitorHash,
        checkedInAt: user.checkedInAt,
        giftDeliveredAt: user.giftDeliveredAt,
        checkinHoje: user.checkinHoje,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return securityErrorResponse(error);
  }
}
