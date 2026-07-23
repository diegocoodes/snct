import { randomUUID } from "node:crypto";

import { requireRole } from "@/lib/auth";
import { readAuditEvents, recordAuditEvent } from "@/lib/audit";
import { onlyDigits, isValidCpf } from "@/lib/cpf";
import { query } from "@/lib/db";
import { hashPassword, isStrongPassword } from "@/lib/password";
import {
  assertTrustedMutation,
  enforceRateLimit,
  securityErrorResponse,
} from "@/lib/request-security";
import {
  getRoleByCodigo,
  listRoles,
} from "@/lib/roles";
import {
  deleteNoticeDocumentFile,
  readSnctStore,
  saveNoticeDocument,
  updateSnctStore,
} from "@/lib/snct-store";
import type {
  ManagedEvent,
  ManagedNotice,
  ManagedNoticeDocument,
  ManagedPartner,
  RoleCodigo,
} from "@/lib/snct-types";
import {
  changeUserRole,
  createQrCodeHash,
  listRoleChanges,
  setUserActive,
} from "@/lib/usuarios";

function clean(value: unknown, maximumLength = 300) {
  return typeof value === "string" ? value.trim().slice(0, maximumLength) : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isAllowedImageUrl(value: string) {
  if (value.startsWith("/")) return !value.startsWith("//");
  try {
    const url = new URL(value);
    const allowedHosts = new Set([
      "paulista.pe.gov.br",
      "snct.paulista.pe.gov.br",
      ...(process.env.SNCT_ALLOWED_IMAGE_HOSTS?.split(",")
        .map((host) => host.trim().toLowerCase())
        .filter(Boolean) ?? []),
    ]);
    return (
      url.protocol === "https:" && allowedHosts.has(url.hostname.toLowerCase())
    );
  } catch {
    return false;
  }
}

async function authorizeMutation(request: Request) {
  assertTrustedMutation(request);
  const session = await requireRole("admin");
  if (!session) return null;
  await enforceRateLimit({
    request,
    scope: "admin",
    identifier: session.userId,
    limit: 120,
    windowSeconds: 60,
  });
  return session;
}

export async function GET(request: Request) {
  const session = await requireRole("admin");
  if (!session) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const url = new URL(request.url);
  const usuarioId = url.searchParams.get("usuarioId");
  if (usuarioId) {
    const [store, roleHistory, roles] = await Promise.all([
      readSnctStore(),
      listRoleChanges(usuarioId),
      listRoles(),
    ]);
    const user = store.users.find((item) => item.id === usuarioId);
    if (!user) {
      return Response.json({ error: "Usuário não encontrado." }, { status: 404 });
    }
    return Response.json({ user, roleHistory, roles });
  }

  const q = (url.searchParams.get("q") ?? "").trim().toLowerCase();
  const [store, auditLogs, roles] = await Promise.all([
    readSnctStore(),
    readAuditEvents(100),
    listRoles(),
  ]);
  const users = q
    ? store.users.filter(
        (user) =>
          user.name.toLowerCase().includes(q) ||
          user.email.toLowerCase().includes(q) ||
          (user.cpf ?? "").includes(onlyDigits(q)),
      )
    : store.users;
  return Response.json({ ...store, users, auditLogs, roles });
}

export async function POST(request: Request) {
  let uploadedDocument: ManagedNoticeDocument | undefined;
  try {
    const session = await authorizeMutation(request);
    if (!session)
      return Response.json({ error: "Não autorizado." }, { status: 401 });

    const formData = await request.formData().catch(() => null);
    const action = clean(formData?.get("action"));
    if (action !== "saveNotice" || !formData) {
      return Response.json({ error: "Ação inválida." }, { status: 400 });
    }

    const title = clean(formData.get("title"), 220);
    const registration = clean(formData.get("registration"), 180);
    const status =
      formData.get("status") === "encerrado" ? "encerrado" : "aberto";
    const id = clean(formData.get("id"), 100) || `notice-${randomUUID()}`;
    const document = formData.get("document");

    if (!title || !registration) {
      return Response.json(
        { error: "Informe o título e o período de inscrições." },
        { status: 400 },
      );
    }

    if (document instanceof File && document.size > 0) {
      uploadedDocument = await saveNoticeDocument(document);
    }

    const notice = await updateSnctStore<ManagedNotice>((store) => {
      const index = store.notices.findIndex((item) => item.id === id);
      const documents = index >= 0 ? [...store.notices[index].documents] : [];
      if (uploadedDocument) documents.push(uploadedDocument);
      const nextNotice: ManagedNotice = {
        id,
        title,
        registration,
        status,
        documents,
      };
      if (index >= 0) store.notices[index] = nextNotice;
      else store.notices.unshift(nextNotice);
      return nextNotice;
    });

    await recordAuditEvent(request, {
      actorId: session.userId,
      actorRole: session.role,
      action: "notice.save",
      entity: "notice",
      entityId: notice.id,
      metadata: { documentAttached: Boolean(uploadedDocument) },
    });
    return Response.json({ notice });
  } catch (error) {
    if (uploadedDocument) {
      await deleteNoticeDocumentFile(uploadedDocument.storageName).catch(
        () => {},
      );
    }
    return securityErrorResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await authorizeMutation(request);
    if (!session)
      return Response.json({ error: "Não autorizado." }, { status: 401 });

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const action = clean(body?.action, 60);

    if (action === "createUser") {
      const name = clean(body?.name, 160);
      const email = clean(body?.email, 254).toLowerCase();
      const password = typeof body?.password === "string" ? body.password : "";
      const requestedRaw =
        typeof body?.roleCodigo === "string"
          ? body.roleCodigo
          : typeof body?.role === "string"
            ? body.role
            : "VISITANTE";
      const roleFromAuth: Record<string, RoleCodigo> = {
        admin: "ADMINISTRADOR",
        staff: "STAFF",
        avaliador: "AVALIADOR",
        professor: "PROFESSOR",
        visitante: "VISITANTE",
        aluno: "ALUNO",
        visitor: "VISITANTE",
        ADMINISTRADOR: "ADMINISTRADOR",
        STAFF: "STAFF",
        AVALIADOR: "AVALIADOR",
        PROFESSOR: "PROFESSOR",
        VISITANTE: "VISITANTE",
        ALUNO: "ALUNO",
      };
      const roleCodigo = roleFromAuth[requestedRaw] ?? "VISITANTE";
      const telefone = onlyDigits(String(body?.telefone ?? "81999999999"));
      const cpf = onlyDigits(String(body?.cpf ?? ""));
      const dataNascimento =
        clean(body?.dataNascimento, 10) || "1990-01-01";

      const roleRow = await getRoleByCodigo(roleCodigo);
      if (!roleRow) {
        return Response.json({ error: "Função inválida." }, { status: 400 });
      }

      if (
        name.length < 2 ||
        !isEmail(email) ||
        !isStrongPassword(password) ||
        !cpf ||
        !isValidCpf(cpf)
      ) {
        return Response.json(
          {
            error: "Informe nome, e-mail, CPF válido e senha forte.",
          },
          { status: 400 },
        );
      }

      const existing = await query<{ id: number }>(
        "SELECT id FROM usuarios WHERE lower(email) = $1 LIMIT 1",
        [email],
      );
      if (existing.rows[0]) {
        return Response.json(
          { error: "Este e-mail já está em uso." },
          { status: 409 },
        );
      }
      const existingCpf = await query<{ id: number }>(
        "SELECT id FROM usuarios WHERE cpf = $1 LIMIT 1",
        [cpf],
      );
      if (existingCpf.rows[0]) {
        return Response.json(
          { error: "Este CPF já está em uso." },
          { status: 409 },
        );
      }

      const qrCodeHash = createQrCodeHash();
      const senhaHash = await hashPassword(password);
      await query(
        `INSERT INTO usuarios
          (role_id, nome_completo, email, telefone, cpf, senha_hash,
           data_nascimento, aceitou_direito_imagem, data_aceite_direito_imagem,
           qr_code_hash, ativo)
         VALUES ($1, $2, $3, $4, $5, $6, $7, TRUE, NOW(3), $8, TRUE)`,
        [
          roleRow.id,
          name,
          email,
          telefone,
          cpf,
          senhaHash,
          dataNascimento,
          qrCodeHash,
        ],
      );
      const created = await query<{ id: number }>(
        "SELECT id FROM usuarios WHERE email = $1 LIMIT 1",
        [email],
      );
      const userId = String(created.rows[0]?.id ?? "");
      const user = (await readSnctStore()).users.find(
        (candidate) => candidate.id === userId,
      );
      await recordAuditEvent(request, {
        actorId: session.userId,
        actorRole: session.role,
        action:
          roleCodigo === "ADMINISTRADOR"
            ? "user.create_admin"
            : roleCodigo === "STAFF"
              ? "user.create_staff"
              : "user.create",
        entity: "usuario",
        entityId: userId,
        metadata: { role: roleCodigo },
      });
      return Response.json({ user });
    }

    if (action === "changeRole") {
      const userId = clean(body?.userId, 100);
      const roleCodigo = clean(body?.roleCodigo, 32) as RoleCodigo;
      const motivo = clean(body?.motivo, 255);
      try {
        const result = await changeUserRole({
          usuarioId: userId,
          novaRoleCodigo: roleCodigo,
          alteradoPorUsuarioId: session.userId,
          motivo,
          request,
        });
        const user = (await readSnctStore()).users.find((item) => item.id === userId);
        return Response.json({ user, ...result });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Falha ao alterar função." },
          { status: 400 },
        );
      }
    }

    if (action === "setActive") {
      const userId = clean(body?.userId, 100);
      const ativo = body?.ativo === true;
      try {
        await setUserActive({
          usuarioId: userId,
          ativo,
          alteradoPorUsuarioId: session.userId,
          request,
        });
        const user = (await readSnctStore()).users.find((item) => item.id === userId);
        return Response.json({ user });
      } catch (error) {
        return Response.json(
          { error: error instanceof Error ? error.message : "Falha ao atualizar status." },
          { status: 400 },
        );
      }
    }

    if (action === "deleteUser") {
      const userId = clean(body?.userId, 100);
      const existing = await query<{ id: number }>(
        `SELECT u.id FROM usuarios u
         INNER JOIN roles r ON r.id = u.role_id
         WHERE u.id = $1 AND r.codigo <> 'ADMINISTRADOR'`,
        [userId],
      );
      if (!existing.rows[0]) {
        return Response.json(
          { error: "Usuário não encontrado ou protegido." },
          { status: 404 },
        );
      }
      await query("DELETE FROM usuarios WHERE id = $1", [userId]);
      await recordAuditEvent(request, {
        actorId: session.userId,
        actorRole: session.role,
        action: "user.delete",
        entity: "usuario",
        entityId: userId,
      });
      return Response.json({ success: true });
    }

    if (action === "saveEvent") {
      const event: ManagedEvent = {
        id: clean(body?.id, 100) || `event-${randomUUID()}`,
        date: clean(body?.date, 30),
        time: clean(body?.time, 20),
        title: clean(body?.title, 220),
        location: clean(body?.location, 180),
      };
      if (!event.date || !event.time || !event.title || !event.location) {
        return Response.json(
          { error: "Preencha todos os dados do evento." },
          { status: 400 },
        );
      }
      await updateSnctStore((store) => {
        const index = store.events.findIndex((item) => item.id === event.id);
        if (index >= 0) store.events[index] = event;
        else store.events.push(event);
      });
      await recordAuditEvent(request, {
        actorId: session.userId,
        actorRole: session.role,
        action: "event.save",
        entity: "event",
        entityId: event.id,
      });
      return Response.json({ event });
    }

    if (action === "deleteEvent") {
      const id = clean(body?.id, 100);
      await updateSnctStore((store) => {
        store.events = store.events.filter((event) => event.id !== id);
      });
      await recordAuditEvent(request, {
        actorId: session.userId,
        actorRole: session.role,
        action: "event.delete",
        entity: "event",
        entityId: id,
      });
      return Response.json({ success: true });
    }

    if (action === "deleteNotice") {
      const id = clean(body?.id, 100);
      const storageNames = await updateSnctStore<string[]>((store) => {
        const notice = store.notices.find((item) => item.id === id);
        store.notices = store.notices.filter((item) => item.id !== id);
        return notice?.documents.map((document) => document.storageName) ?? [];
      });
      await Promise.all(storageNames.map(deleteNoticeDocumentFile));
      await recordAuditEvent(request, {
        actorId: session.userId,
        actorRole: session.role,
        action: "notice.delete",
        entity: "notice",
        entityId: id,
      });
      return Response.json({ success: true });
    }

    if (action === "deleteNoticeDocument") {
      const noticeId = clean(body?.noticeId, 100);
      const documentId = clean(body?.documentId, 100);
      const storageName = await updateSnctStore<string | undefined>((store) => {
        const notice = store.notices.find((item) => item.id === noticeId);
        const document = notice?.documents.find(
          (item) => item.id === documentId,
        );
        if (notice)
          notice.documents = notice.documents.filter(
            (item) => item.id !== documentId,
          );
        return document?.storageName;
      });
      if (storageName) await deleteNoticeDocumentFile(storageName);
      await recordAuditEvent(request, {
        actorId: session.userId,
        actorRole: session.role,
        action: "document.delete",
        entity: "document",
        entityId: documentId,
      });
      return Response.json({ success: true });
    }

    if (action === "addPartner") {
      const partner: ManagedPartner = {
        id: `partner-${randomUUID()}`,
        name: clean(body?.name, 160),
        logo: clean(body?.logo, 600),
      };
      if (!partner.name || !isAllowedImageUrl(partner.logo)) {
        return Response.json(
          { error: "Use um nome e uma URL HTTPS de domínio autorizado." },
          { status: 400 },
        );
      }
      await updateSnctStore((store) => store.partners.push(partner));
      await recordAuditEvent(request, {
        actorId: session.userId,
        actorRole: session.role,
        action: "partner.create",
        entity: "partner",
        entityId: partner.id,
      });
      return Response.json({ partner });
    }

    if (action === "deletePartner") {
      const id = clean(body?.id, 100);
      await updateSnctStore((store) => {
        store.partners = store.partners.filter((partner) => partner.id !== id);
      });
      await recordAuditEvent(request, {
        actorId: session.userId,
        actorRole: session.role,
        action: "partner.delete",
        entity: "partner",
        entityId: id,
      });
      return Response.json({ success: true });
    }

    if (action === "updateSettings") {
      const eventEdition = clean(body?.eventEdition, 100);
      const heroImageUrl = clean(body?.heroImageUrl, 600);
      if (!eventEdition || !isAllowedImageUrl(heroImageUrl)) {
        return Response.json(
          {
            error: "Preencha a edição e use uma imagem de domínio autorizado.",
          },
          { status: 400 },
        );
      }
      await updateSnctStore((store) => {
        store.settings = { eventEdition, heroImageUrl };
      });
      await recordAuditEvent(request, {
        actorId: session.userId,
        actorRole: session.role,
        action: "settings.update",
        entity: "settings",
        entityId: "1",
      });
      return Response.json({ settings: { eventEdition, heroImageUrl } });
    }

    return Response.json({ error: "Ação inválida." }, { status: 400 });
  } catch (error) {
    return securityErrorResponse(error);
  }
}
