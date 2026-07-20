import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import { featuredNotices, upcomingEvents } from "@/config/highlights";
import { partners } from "@/config/partners";
import type { ManagedNoticeDocument, SnctStore } from "@/lib/snct-types";

const dataDirectory = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDirectory, "snct-store.json");
const uploadsDirectory = path.join(dataDirectory, "uploads");
const maximumDocumentSize = 10 * 1024 * 1024;
const allowedDocumentExtensions = new Set([
  ".doc",
  ".docx",
  ".odt",
  ".pdf",
  ".xls",
  ".xlsx",
]);

const defaultStore: SnctStore = {
  users: [],
  events: upcomingEvents.map((event, index) => ({
    id: `event-${index + 1}`,
    ...event,
  })),
  notices: featuredNotices.map((notice, index) => ({
    id: `notice-${index + 1}`,
    ...notice,
    documents: [],
  })),
  partners: partners.map((partner, index) => ({
    id: `partner-${index + 1}`,
    ...partner,
  })),
  settings: {
    eventEdition: "Paulista 2026",
    heroImageUrl: "/images/cienciasemfundo.png",
  },
};

let mutationQueue = Promise.resolve();

function normalizeStore(value: Partial<SnctStore>): SnctStore {
  return {
    users: Array.isArray(value.users) ? value.users : [],
    events: Array.isArray(value.events) ? value.events : defaultStore.events,
    notices: Array.isArray(value.notices)
      ? value.notices.map((notice) => ({
          ...notice,
          documents: Array.isArray(notice.documents) ? notice.documents : [],
        }))
      : defaultStore.notices,
    partners: Array.isArray(value.partners)
      ? value.partners
      : defaultStore.partners,
    settings: {
      ...defaultStore.settings,
      ...(value.settings ?? {}),
    },
  };
}

export async function readSnctStore(): Promise<SnctStore> {
  try {
    const contents = await readFile(dataFile, "utf8");
    return normalizeStore(JSON.parse(contents) as Partial<SnctStore>);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return structuredClone(defaultStore);
    }
    throw error;
  }
}

export async function updateSnctStore<T>(
  mutate: (store: SnctStore) => T | Promise<T>,
): Promise<T> {
  let result!: T;

  mutationQueue = mutationQueue.then(async () => {
    const store = await readSnctStore();
    result = await mutate(store);
    await mkdir(dataDirectory, { recursive: true });
    const temporaryFile = `${dataFile}.${process.pid}.tmp`;
    await writeFile(temporaryFile, JSON.stringify(store, null, 2), "utf8");
    await rename(temporaryFile, dataFile);
  });

  await mutationQueue;
  return result;
}

export async function saveNoticeDocument(
  file: File,
): Promise<ManagedNoticeDocument> {
  const originalName = path.basename(file.name).slice(0, 140);
  const extension = path.extname(originalName).toLowerCase();

  if (
    !originalName ||
    !allowedDocumentExtensions.has(extension) ||
    file.size < 1 ||
    file.size > maximumDocumentSize
  ) {
    throw new Error(
      "Use um arquivo PDF, DOC, DOCX, ODT, XLS ou XLSX de até 10 MB.",
    );
  }

  const id = `document-${randomUUID()}`;
  const storageName = `${id}${extension}`;
  await mkdir(uploadsDirectory, { recursive: true });
  await writeFile(
    path.join(uploadsDirectory, storageName),
    Buffer.from(await file.arrayBuffer()),
  );

  return {
    id,
    name: originalName,
    storageName,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
  };
}

export async function readNoticeDocument(storageName: string) {
  if (!/^[a-z0-9._-]+$/i.test(storageName)) {
    throw new Error("Nome de arquivo inválido.");
  }
  return readFile(path.join(uploadsDirectory, storageName));
}

export async function deleteNoticeDocumentFile(storageName: string) {
  if (!/^[a-z0-9._-]+$/i.test(storageName)) return;
  try {
    await unlink(path.join(uploadsDirectory, storageName));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
