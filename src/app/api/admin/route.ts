import { randomUUID } from "node:crypto";

import {
  createVisitorHash,
  hashPassword,
  requireRole,
  toPublicUser,
} from "@/lib/auth";
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
  StoredUser,
} from "@/lib/snct-types";

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function GET() {
  if (!(await requireRole("admin"))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }
  const store = await readSnctStore();
  return Response.json({
    ...store,
    users: store.users.map(toPublicUser),
  });
}

export async function POST(request: Request) {
  if (!(await requireRole("admin"))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const formData = await request.formData().catch(() => null);
  const action = clean(formData?.get("action"));

  if (action !== "saveNotice" || !formData) {
    return Response.json({ error: "Ação inválida." }, { status: 400 });
  }

  const title = clean(formData.get("title"));
  const registration = clean(formData.get("registration"));
  const status =
    formData.get("status") === "encerrado" ? "encerrado" : "aberto";
  const id = clean(formData.get("id")) || `notice-${randomUUID()}`;
  const document = formData.get("document");

  if (!title || !registration) {
    return Response.json(
      { error: "Informe o título e o período de inscrições." },
      { status: 400 },
    );
  }

  let uploadedDocument: ManagedNoticeDocument | undefined;
  if (document instanceof File && document.size > 0) {
    try {
      uploadedDocument = await saveNoticeDocument(document);
    } catch (error) {
      return Response.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Não foi possível anexar o documento.",
        },
        { status: 400 },
      );
    }
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

  return Response.json({ notice });
}

export async function PATCH(request: Request) {
  if (!(await requireRole("admin"))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const action = clean(body?.action);

  if (action === "createUser") {
    const name = clean(body?.name);
    const email = clean(body?.email).toLowerCase();
    const password = clean(body?.password);
    const role = body?.role === "staff" ? "staff" : "visitor";
    const age = body?.age ? Number(body.age) : undefined;
    const reservedAdminEmail = process.env.SNCT_ADMIN_EMAIL?.toLowerCase();

    if (
      name.length < 2 ||
      !isEmail(email) ||
      password.length < 8 ||
      email === reservedAdminEmail ||
      (role === "visitor" &&
        (!Number.isInteger(age) || (age ?? 0) < 5 || (age ?? 0) > 120))
    ) {
      return Response.json(
        {
          error:
            "Informe nome, e-mail, senha com 8 caracteres e idade válida para visitantes.",
        },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);
    const created = await updateSnctStore<StoredUser | null>((store) => {
      if (store.users.some((user) => user.email.toLowerCase() === email)) {
        return null;
      }
      const user: StoredUser = {
        id: `${role}-${randomUUID()}`,
        name,
        email,
        age: role === "visitor" && age ? age : undefined,
        role,
        passwordHash,
        visitorHash: role === "visitor" ? createVisitorHash() : undefined,
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
      return user;
    });

    if (!created) {
      return Response.json(
        { error: "Este e-mail já está em uso." },
        { status: 409 },
      );
    }
    return Response.json({ user: toPublicUser(created) });
  }

  if (action === "deleteUser") {
    const userId = clean(body?.userId);
    await updateSnctStore((store) => {
      store.users = store.users.filter((user) => user.id !== userId);
    });
    return Response.json({ success: true });
  }

  if (action === "saveEvent") {
    const event: ManagedEvent = {
      id: clean(body?.id) || `event-${randomUUID()}`,
      date: clean(body?.date),
      time: clean(body?.time),
      title: clean(body?.title),
      location: clean(body?.location),
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
    return Response.json({ event });
  }

  if (action === "deleteEvent") {
    const id = clean(body?.id);
    await updateSnctStore((store) => {
      store.events = store.events.filter((event) => event.id !== id);
    });
    return Response.json({ success: true });
  }

  if (action === "deleteNotice") {
    const id = clean(body?.id);
    const storageNames = await updateSnctStore<string[]>((store) => {
      const notice = store.notices.find((item) => item.id === id);
      store.notices = store.notices.filter((item) => item.id !== id);
      return notice?.documents.map((document) => document.storageName) ?? [];
    });
    await Promise.all(storageNames.map(deleteNoticeDocumentFile));
    return Response.json({ success: true });
  }

  if (action === "deleteNoticeDocument") {
    const noticeId = clean(body?.noticeId);
    const documentId = clean(body?.documentId);
    const storageName = await updateSnctStore<string | undefined>((store) => {
      const notice = store.notices.find((item) => item.id === noticeId);
      const document = notice?.documents.find((item) => item.id === documentId);
      if (notice) {
        notice.documents = notice.documents.filter(
          (item) => item.id !== documentId,
        );
      }
      return document?.storageName;
    });
    if (storageName) await deleteNoticeDocumentFile(storageName);
    return Response.json({ success: true });
  }

  if (action === "addPartner") {
    const partner: ManagedPartner = {
      id: `partner-${randomUUID()}`,
      name: clean(body?.name),
      logo: clean(body?.logo),
    };
    if (!partner.name || !/^https?:\/\//.test(partner.logo)) {
      return Response.json(
        { error: "Informe o nome e uma URL válida para a logomarca." },
        { status: 400 },
      );
    }
    await updateSnctStore((store) => store.partners.push(partner));
    return Response.json({ partner });
  }

  if (action === "deletePartner") {
    const id = clean(body?.id);
    await updateSnctStore((store) => {
      store.partners = store.partners.filter((partner) => partner.id !== id);
    });
    return Response.json({ success: true });
  }

  if (action === "updateSettings") {
    const eventEdition = clean(body?.eventEdition);
    const heroImageUrl = clean(body?.heroImageUrl);
    if (
      !eventEdition ||
      (!heroImageUrl.startsWith("/") && !/^https?:\/\//.test(heroImageUrl))
    ) {
      return Response.json(
        { error: "Preencha a edição e use um caminho local ou URL válida." },
        { status: 400 },
      );
    }
    await updateSnctStore((store) => {
      store.settings = { eventEdition, heroImageUrl };
    });
    return Response.json({ settings: { eventEdition, heroImageUrl } });
  }

  return Response.json({ error: "Ação inválida." }, { status: 400 });
}
