import "server-only";

import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";

import { readSnctStore } from "@/lib/snct-store";
import type {
  PublicUser,
  SessionData,
  StoredUser,
  UserRole,
} from "@/lib/snct-types";

const scrypt = promisify(scryptCallback);
const sessionCookieName = "snct_session";
const sessionDurationSeconds = 60 * 60 * 8;

function getSessionSecret() {
  const secret = process.env.SNCT_SESSION_SECRET;
  if (!secret) {
    throw new Error("SNCT_SESSION_SECRET não foi configurado.");
  }
  return secret;
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret())
    .update(value)
    .digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return safeEqual(derivedKey.toString("hex"), key);
}

export function createVisitorHash() {
  return createHmac("sha256", randomBytes(32))
    .update(`${Date.now()}-${randomBytes(16).toString("hex")}`)
    .digest("hex");
}

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    age: user.age,
    role: user.role,
    visitorHash: user.visitorHash,
    createdAt: user.createdAt,
    checkedInAt: user.checkedInAt,
    giftDeliveredAt: user.giftDeliveredAt,
  };
}

export async function authenticateUser(
  email: string,
  password: string,
  role: UserRole,
): Promise<SessionData | null> {
  const normalizedEmail = email.trim().toLowerCase();
  const expiresAt = Date.now() + sessionDurationSeconds * 1000;

  if (role === "admin") {
    const adminEmail = process.env.SNCT_ADMIN_EMAIL?.toLowerCase();
    const adminPassword = process.env.SNCT_ADMIN_PASSWORD;
    if (
      adminEmail &&
      adminPassword &&
      safeEqual(normalizedEmail, adminEmail) &&
      safeEqual(password, adminPassword)
    ) {
      return {
        userId: "admin",
        name: "Administrador SNCT",
        email: adminEmail,
        role,
        expiresAt,
      };
    }
    return null;
  }

  const store = await readSnctStore();
  const user = store.users.find(
    (candidate) =>
      candidate.email.toLowerCase() === normalizedEmail &&
      candidate.role === role,
  );
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return null;
  }

  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    expiresAt,
  };
}

function encodeSession(session: SessionData) {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(token: string): SessionData | null {
  const [payload, signature] = token.split(".");
  if (!payload || !signature || !safeEqual(sign(payload), signature)) {
    return null;
  }

  try {
    const session = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as SessionData;
    return session.expiresAt > Date.now() ? session : null;
  } catch {
    return null;
  }
}

export async function setSession(session: SessionData) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionDurationSeconds,
    priority: "high",
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getSession(): Promise<SessionData | null> {
  const token = (await cookies()).get(sessionCookieName)?.value;
  if (!token) return null;
  const session = decodeSession(token);
  if (!session) return null;

  if (session.role !== "admin") {
    const store = await readSnctStore();
    const stillExists = store.users.some(
      (user) => user.id === session.userId && user.role === session.role,
    );
    if (!stillExists) return null;
  }

  return session;
}

export async function requireRole(...roles: UserRole[]) {
  const session = await getSession();
  return session && roles.includes(session.role) ? session : null;
}
