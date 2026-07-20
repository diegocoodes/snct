import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

type VersionedKey = { version: number; key: Buffer };

function getKeys() {
  const configured = process.env.SNCT_DATA_ENCRYPTION_KEYS;
  if (!configured) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("SNCT_DATA_ENCRYPTION_KEYS não foi configurado.");
    }
    return [];
  }

  const keys = configured.split(",").map((entry) => {
    const [rawVersion, encodedKey] = entry.trim().split(":", 2);
    const version = Number(rawVersion);
    const key = Buffer.from(encodedKey ?? "", "base64");
    if (!Number.isInteger(version) || version < 1 || key.length !== 32) {
      throw new Error(
        "SNCT_DATA_ENCRYPTION_KEYS deve usar o formato versão:chave-base64-de-32-bytes.",
      );
    }
    return { version, key } satisfies VersionedKey;
  });
  if (new Set(keys.map((entry) => entry.version)).size !== keys.length) {
    throw new Error("SNCT_DATA_ENCRYPTION_KEYS não pode repetir versões.");
  }
  return keys;
}

export function encryptFile(buffer: Buffer) {
  const keys = getKeys();
  if (!keys.length) {
    return {
      encrypted: buffer,
      iv: Buffer.alloc(0),
      tag: Buffer.alloc(0),
      keyVersion: 0,
    };
  }
  const active = keys.sort((left, right) => right.version - left.version)[0];
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", active.key, iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return {
    encrypted,
    iv,
    tag: cipher.getAuthTag(),
    keyVersion: active.version,
  };
}

export function decryptFile(
  encrypted: Buffer,
  iv: Buffer,
  tag: Buffer,
  keyVersion: number,
) {
  if (keyVersion === 0 && process.env.NODE_ENV !== "production")
    return encrypted;
  const selected = getKeys().find((entry) => entry.version === keyVersion);
  if (!selected)
    throw new Error("Chave de criptografia do arquivo indisponível.");
  const decipher = createDecipheriv("aes-256-gcm", selected.key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]);
}
