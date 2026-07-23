import {
  assertTrustedMutation,
  enforceRateLimit,
  securityErrorResponse,
} from "@/lib/request-security";
import type { RoleCodigo } from "@/lib/snct-types";
import { registrarUsuario, type RegistroUsuarioInput } from "@/lib/usuarios";

async function parseRegistroBody(request: Request): Promise<RegistroUsuarioInput> {
  const contentType = request.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    const foto = form.get("foto");
    let fotoBuffer: Buffer | null = null;
    let fotoFilename: string | null = null;
    if (foto instanceof File && foto.size > 0) {
      fotoBuffer = Buffer.from(await foto.arrayBuffer());
      fotoFilename = foto.name;
    }
    return {
      nomeCompleto: String(form.get("nomeCompleto") ?? form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      telefone: String(form.get("telefone") ?? ""),
      cpf: String(form.get("cpf") ?? ""),
      dataNascimento: String(form.get("dataNascimento") ?? ""),
      senha: String(form.get("senha") ?? form.get("password") ?? ""),
      aceitouDireitoImagem:
        form.get("aceitouDireitoImagem") === "true" ||
        form.get("aceitouDireitoImagem") === "on",
      privacyConsent:
        form.get("privacyConsent") === "true" ||
        form.get("privacyConsent") === "on" ||
        form.get("privacyConsent") == null,
      guardianConsent:
        form.get("guardianConsent") === "true" ||
        form.get("guardianConsent") === "on",
      fotoBuffer,
      fotoFilename,
    };
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  return {
    nomeCompleto: String(body?.nomeCompleto ?? body?.name ?? ""),
    email: String(body?.email ?? ""),
    telefone: String(body?.telefone ?? ""),
    cpf: String(body?.cpf ?? ""),
    dataNascimento: String(body?.dataNascimento ?? ""),
    senha: String(body?.senha ?? body?.password ?? ""),
    aceitouDireitoImagem: body?.aceitouDireitoImagem === true,
    privacyConsent: body?.privacyConsent !== false,
    guardianConsent: body?.guardianConsent === true,
  };
}

export function createRegistroHandler(rolePermitida: RoleCodigo) {
  return async function POST(request: Request) {
    try {
      assertTrustedMutation(request);
      const dados = await parseRegistroBody(request);

      await enforceRateLimit({
        request,
        scope: `register-${rolePermitida.toLowerCase()}`,
        identifier: dados.email,
        limit: 3,
        windowSeconds: 10 * 60,
      });

      // Ignora qualquer role enviada pelo cliente
      const result = await registrarUsuario(dados, rolePermitida, request);
      if (!result.ok) {
        return Response.json({ error: result.error }, { status: result.status });
      }

      return Response.json(
        {
          user: {
            id: result.user.id,
            nomeCompleto: result.user.name,
            email: result.user.email,
            role: result.user.role,
            roleCodigo: result.user.roleCodigo,
            qrCodeHash: result.qrCodeHash,
            foto: result.user.foto,
          },
          qrCodeHash: result.qrCodeHash,
          message: "Inscrição concluída com sucesso.",
        },
        { status: 201 },
      );
    } catch (error) {
      return securityErrorResponse(error);
    }
  };
}

export const POST_AVALIADOR = createRegistroHandler("AVALIADOR");
export const POST_PROFESSOR = createRegistroHandler("PROFESSOR");
export const POST_VISITANTE = createRegistroHandler("VISITANTE");
