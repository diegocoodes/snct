import { createHash, randomUUID } from "node:crypto";
import path from "node:path";
import type { PoolConnection, RowDataPacket } from "mysql2/promise";
import { fileTypeFromBuffer } from "file-type";

import { featuredNotices, upcomingEvents } from "@/config/highlights";
import { partners } from "@/config/partners";
import { assertFileIsClean } from "@/lib/clamav";
import { query, transaction, clientQuery, clientExecute } from "@/lib/db";
import { decryptFile, encryptFile } from "@/lib/encryption";
import type {
  ManagedNoticeDocument,
  SnctStore,
  StoredUser,
  UserRole,
} from "@/lib/snct-types";

const maximumDocumentSize = 10 * 1024 * 1024;
const allowedDocumentTypes: Record<string, Set<string>> = {
  ".pdf": new Set(["application/pdf"]),
  ".doc": new Set(["application/x-cfb"]),
  ".xls": new Set(["application/x-cfb"]),
  ".docx": new Set([
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
  ".xlsx": new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ]),
  ".odt": new Set(["application/vnd.oasis.opendocument.text"]),
};

const defaultSettings = {
  eventEdition: "Paulista 2026",
  heroImageUrl: "/images/cienciasemfundo.png",
};

function iso(value: Date | string | null | undefined) {
  return value ? new Date(value).toISOString() : undefined;
}

async function ensureDomainSeeded() {
  await transaction(async (client) => {
    await clientQuery(client, "SELECT GET_LOCK('snct-seed', 10)");
    const settings = await clientQuery(
      client,
      "SELECT id FROM snct_site_settings WHERE id = 1",
    );
    if (settings.rowCount) return;

    await clientQuery(
      client,
      `INSERT INTO snct_site_settings (id, event_edition, hero_image_url)
       VALUES (1, $1, $2)`,
      [defaultSettings.eventEdition, defaultSettings.heroImageUrl],
    );

    for (const [index, event] of upcomingEvents.entries()) {
      await clientQuery(
        client,
        `INSERT INTO snct_events
          (id, event_date, event_time, title, location, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          `event-${index + 1}`,
          event.date,
          event.time,
          event.title,
          event.location,
          index,
        ],
      );
    }

    for (const [index, notice] of featuredNotices.entries()) {
      await clientQuery(
        client,
        `INSERT INTO snct_notices
          (id, title, registration, status, sort_order)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          `notice-${index + 1}`,
          notice.title,
          notice.registration,
          notice.status,
          index,
        ],
      );
    }

    for (const [index, partner] of partners.entries()) {
      await clientQuery(
        client,
        `INSERT INTO snct_partners (id, name, logo, sort_order)
         VALUES ($1, $2, $3, $4)`,
        [`partner-${index + 1}`, partner.name, partner.logo, index],
      );
    }
  });
}

async function readStore(client?: PoolConnection) {
  const run = <T extends RowDataPacket>(text: string, values: unknown[] = []) =>
    client ? clientQuery<T>(client, text, values) : query<T>(text, values);

  const [users, events, notices, documents, managedPartners, settings] =
    await Promise.all([
      run<{
        id: string;
        name: string;
        email: string;
        role: UserRole;
        email_verified: boolean;
        two_factor_enabled: boolean;
        created_at: Date;
        age: number | null;
        visitor_hash: string | null;
        checked_in_at: Date | null;
        gift_delivered_at: Date | null;
        privacy_accepted_at: Date | null;
        privacy_version: string | null;
        guardian_consent_at: Date | null;
        qr_expires_at: Date | null;
        qr_revoked_at: Date | null;
      } & RowDataPacket>(`
        SELECT users.id, users.name, users.email, users.role,
               users.\`emailVerified\` AS email_verified,
               users.\`twoFactorEnabled\` AS two_factor_enabled,
               users.\`createdAt\` AS created_at,
               profiles.age, profiles.visitor_hash, profiles.checked_in_at,
               profiles.gift_delivered_at, profiles.privacy_accepted_at,
               profiles.privacy_version, profiles.guardian_consent_at,
               profiles.qr_expires_at, profiles.qr_revoked_at
        FROM auth_users AS users
        LEFT JOIN snct_profiles AS profiles ON profiles.user_id = users.id
        ORDER BY users.\`createdAt\` ASC
      `),
      run<{
        id: string;
        event_date: string;
        event_time: string;
        title: string;
        location: string;
      } & RowDataPacket>(`
        SELECT id, event_date, event_time, title, location
        FROM snct_events ORDER BY sort_order, created_at
      `),
      run<{
        id: string;
        title: string;
        registration: string;
        status: "aberto" | "encerrado";
      } & RowDataPacket>(`
        SELECT id, title, registration, status
        FROM snct_notices ORDER BY sort_order, created_at
      `),
      run<{
        id: string;
        notice_id: string;
        original_name: string;
        storage_name: string;
        mime_type: string;
        byte_size: number;
      } & RowDataPacket>(`
        SELECT id, notice_id, original_name, storage_name, mime_type, byte_size
        FROM snct_notice_documents
        WHERE notice_id IS NOT NULL AND scan_status = 'clean'
        ORDER BY created_at
      `),
      run<{ id: string; name: string; logo: string } & RowDataPacket>(`
        SELECT id, name, logo FROM snct_partners ORDER BY sort_order, created_at
      `),
      run<{
        event_edition: string;
        hero_image_url: string;
      } & RowDataPacket>(`
        SELECT event_edition, hero_image_url
        FROM snct_site_settings WHERE id = 1
      `),
    ]);

  const publicUsers: StoredUser[] = users.rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    emailVerified: row.email_verified,
    twoFactorEnabled: row.two_factor_enabled,
    createdAt: iso(row.created_at)!,
    age: row.age ?? undefined,
    visitorHash: row.visitor_hash ?? undefined,
    checkedInAt: iso(row.checked_in_at),
    giftDeliveredAt: iso(row.gift_delivered_at),
    privacyAcceptedAt: iso(row.privacy_accepted_at),
    privacyVersion: row.privacy_version ?? undefined,
    guardianConsentAt: iso(row.guardian_consent_at),
    qrExpiresAt: iso(row.qr_expires_at),
    qrRevokedAt: iso(row.qr_revoked_at),
  }));

  return {
    users: publicUsers,
    events: events.rows.map((row) => ({
      id: row.id,
      date: row.event_date,
      time: row.event_time,
      title: row.title,
      location: row.location,
    })),
    notices: notices.rows.map((notice) => ({
      ...notice,
      documents: documents.rows
        .filter((document) => document.notice_id === notice.id)
        .map((document) => ({
          id: document.id,
          name: document.original_name,
          storageName: document.storage_name,
          mimeType: document.mime_type,
          size: document.byte_size,
        })),
    })),
    partners: managedPartners.rows,
    settings: settings.rows[0]
      ? {
          eventEdition: settings.rows[0].event_edition,
          heroImageUrl: settings.rows[0].hero_image_url,
        }
      : defaultSettings,
  } satisfies SnctStore;
}

export async function readSnctStore(): Promise<SnctStore> {
  await ensureDomainSeeded();
  return readStore();
}

async function deleteMissingIds(
  client: PoolConnection,
  table: string,
  ids: string[],
) {
  if (ids.length === 0) {
    await clientExecute(client, `DELETE FROM ${table}`);
    return;
  }
  const placeholders = ids.map((_, index) => `$${index + 1}`).join(", ");
  await clientExecute(
    client,
    `DELETE FROM ${table} WHERE id NOT IN (${placeholders})`,
    ids,
  );
}

async function syncContent(client: PoolConnection, store: SnctStore) {
  for (const [index, event] of store.events.entries()) {
    await clientQuery(
      client,
      `INSERT INTO snct_events
        (id, event_date, event_time, title, location, sort_order, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, now())
       ON DUPLICATE KEY UPDATE
         event_date = VALUES(event_date), event_time = VALUES(event_time),
         title = VALUES(title), location = VALUES(location),
         sort_order = VALUES(sort_order), updated_at = now()`,
      [event.id, event.date, event.time, event.title, event.location, index],
    );
  }
  await deleteMissingIds(
    client,
    "snct_events",
    store.events.map((event) => event.id),
  );

  for (const [index, notice] of store.notices.entries()) {
    await clientQuery(
      client,
      `INSERT INTO snct_notices
        (id, title, registration, status, sort_order, updated_at)
       VALUES ($1, $2, $3, $4, $5, now())
       ON DUPLICATE KEY UPDATE
         title = VALUES(title), registration = VALUES(registration),
         status = VALUES(status), sort_order = VALUES(sort_order),
         updated_at = now()`,
      [notice.id, notice.title, notice.registration, notice.status, index],
    );
    for (const document of notice.documents) {
      await clientQuery(
        client,
        "UPDATE snct_notice_documents SET notice_id = $1 WHERE id = $2",
        [notice.id, document.id],
      );
    }
  }
  await deleteMissingIds(
    client,
    "snct_notices",
    store.notices.map((notice) => notice.id),
  );

  for (const [index, partner] of store.partners.entries()) {
    await clientQuery(
      client,
      `INSERT INTO snct_partners
        (id, name, logo, sort_order, updated_at)
       VALUES ($1, $2, $3, $4, now())
       ON DUPLICATE KEY UPDATE
         name = VALUES(name), logo = VALUES(logo),
         sort_order = VALUES(sort_order), updated_at = now()`,
      [partner.id, partner.name, partner.logo, index],
    );
  }
  await deleteMissingIds(
    client,
    "snct_partners",
    store.partners.map((partner) => partner.id),
  );

  await clientQuery(
    client,
    `UPDATE snct_site_settings
     SET event_edition = $1, hero_image_url = $2, updated_at = now()
     WHERE id = 1`,
    [store.settings.eventEdition, store.settings.heroImageUrl],
  );

  for (const user of store.users) {
    if (user.role !== "visitor") continue;
    await clientQuery(
      client,
      `UPDATE snct_profiles SET
         checked_in_at = $2, gift_delivered_at = $3,
         qr_expires_at = $4, qr_revoked_at = $5, updated_at = now()
       WHERE user_id = $1`,
      [
        user.id,
        user.checkedInAt ?? null,
        user.giftDeliveredAt ?? null,
        user.qrExpiresAt ?? null,
        user.qrRevokedAt ?? null,
      ],
    );
  }
}

export async function updateSnctStore<T>(
  mutate: (store: SnctStore) => T | Promise<T>,
): Promise<T> {
  await ensureDomainSeeded();
  return transaction(async (client) => {
    await clientQuery(client, "SELECT GET_LOCK('snct-store', 10)");
    const store = await readStore(client);
    const result = await mutate(store);
    await syncContent(client, store);
    return result;
  });
}

export async function saveNoticeDocument(
  file: File,
): Promise<ManagedNoticeDocument> {
  const originalName = path.basename(file.name).slice(0, 140);
  const extension = path.extname(originalName).toLowerCase();
  if (
    !originalName ||
    !allowedDocumentTypes[extension] ||
    file.size < 1 ||
    file.size > maximumDocumentSize
  ) {
    throw new Error(
      "Use um arquivo PDF, DOC, DOCX, ODT, XLS ou XLSX de até 10 MB.",
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = await fileTypeFromBuffer(buffer);
  const mimeType = detected?.mime ?? "";
  if (!allowedDocumentTypes[extension].has(mimeType)) {
    throw new Error(
      "O conteúdo do arquivo não corresponde à extensão informada.",
    );
  }

  await assertFileIsClean(buffer);

  const id = `document-${randomUUID()}`;
  const storageName = `${id}${extension}`;
  const sha256 = createHash("sha256").update(buffer).digest("hex");
  const encrypted = encryptFile(buffer);
  await query(
    `INSERT INTO snct_notice_documents
      (id, original_name, storage_name, mime_type, byte_size, sha256,
       scan_status, encryption_iv, encryption_tag, encryption_key_version,
       file_data)
     VALUES ($1, $2, $3, $4, $5, $6, 'clean', $7, $8, $9, $10)`,
    [
      id,
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
    storageName,
    mimeType,
    size: buffer.byteLength,
  };
}

export async function readNoticeDocument(storageName: string) {
  if (!/^[a-z0-9._-]+$/i.test(storageName)) {
    throw new Error("Nome de arquivo inválido.");
  }
  const result = await query<{
    file_data: Buffer;
    encryption_iv: Buffer;
    encryption_tag: Buffer;
    encryption_key_version: number;
  } & RowDataPacket>(
    `SELECT file_data, encryption_iv, encryption_tag, encryption_key_version
     FROM snct_notice_documents
     WHERE storage_name = $1 AND scan_status = 'clean'`,
    [storageName],
  );
  if (!result.rows[0]) throw new Error("Arquivo não encontrado.");
  const file = result.rows[0];
  return decryptFile(
    file.file_data,
    file.encryption_iv,
    file.encryption_tag,
    file.encryption_key_version,
  );
}

export async function deleteNoticeDocumentFile(storageName: string) {
  if (!/^[a-z0-9._-]+$/i.test(storageName)) return;
  await query("DELETE FROM snct_notice_documents WHERE storage_name = $1", [
    storageName,
  ]);
}

export async function rotateVisitorQr(userId: string) {
  const visitorHash = randomUUID() + randomUUID();
  await query(
    `UPDATE snct_profiles SET
       visitor_hash = $2, qr_revoked_at = NULL,
       qr_expires_at = DATE_ADD(NOW(3), INTERVAL 1 YEAR), updated_at = now()
     WHERE user_id = $1`,
    [userId, visitorHash],
  );
  const result = await query<
    { visitor_hash: string; qr_expires_at: Date } & RowDataPacket
  >(
    `SELECT visitor_hash, qr_expires_at FROM snct_profiles WHERE user_id = $1`,
    [userId],
  );
  return result.rows[0]
    ? {
        visitorHash: result.rows[0].visitor_hash,
        qrExpiresAt: result.rows[0].qr_expires_at.toISOString(),
      }
    : null;
}
