import { AsyncLocalStorage } from "node:async_hooks";
import { randomBytes } from "node:crypto";

import { betterAuth } from "better-auth";
import { twoFactor } from "better-auth/plugins";

import { db, query } from "@/lib/db";
import { sendSecurityEmail } from "@/lib/mailer";
import { hashPassword, verifyPassword } from "@/lib/password";
import type { PublicUser, SessionData, UserRole } from "@/lib/snct-types";

export const requestHeaders = new AsyncLocalStorage<Headers>();

const baseURL = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
const isProduction = process.env.NODE_ENV === "production";

export const auth = betterAuth({
  appName: "SNCT Paulista 2026",
  baseURL,
  secret: process.env.BETTER_AUTH_SECRET ?? process.env.SNCT_SESSION_SECRET,
  database: db,
  trustedOrigins: [
    baseURL,
    ...(process.env.SNCT_TRUSTED_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []),
  ],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 12,
    maxPasswordLength: 128,
    requireEmailVerification: isProduction,
    autoSignIn: !isProduction,
    revokeSessionsOnPasswordReset: true,
    password: {
      hash: hashPassword,
      verify: ({ hash, password }) => verifyPassword(hash, password),
    },
    sendResetPassword: async ({ user, url }) => {
      await sendSecurityEmail({
        to: user.email,
        subject: "Redefinição de senha — SNCT Paulista 2026",
        heading: "Redefina sua senha",
        message:
          "Recebemos uma solicitação para redefinir a senha da sua conta.",
        actionLabel: "Criar nova senha",
        actionUrl: url,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: isProduction,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60,
    sendVerificationEmail: async ({ user, url }) => {
      await sendSecurityEmail({
        to: user.email,
        subject: "Confirme seu e-mail — SNCT Paulista 2026",
        heading: "Confirme seu e-mail",
        message:
          "Use o botão abaixo para confirmar o cadastro e ativar sua credencial.",
        actionLabel: "Confirmar cadastro",
        actionUrl: url,
      });
    },
  },
  user: {
    modelName: "auth_users",
    additionalFields: {
      role: {
        type: ["visitor", "staff", "admin"],
        required: true,
        defaultValue: "visitor",
        input: false,
      },
    },
    deleteUser: {
      enabled: true,
      deleteTokenExpiresIn: 60 * 30,
      sendDeleteAccountVerification: isProduction
        ? async ({ user, url }) => {
            await sendSecurityEmail({
              to: user.email,
              subject: "Exclusão de conta — SNCT Paulista 2026",
              heading: "Confirme a exclusão da conta",
              message:
                "Esta ação remove sua conta e sua credencial permanentemente.",
              actionLabel: "Excluir minha conta",
              actionUrl: url,
            });
          }
        : undefined,
      afterDelete: async (user) => {
        await query(
          `UPDATE snct_privacy_requests
           SET status = 'completed', completed_at = now()
           WHERE user_id = $1 AND request_type = 'deletion' AND status <> 'completed'`,
          [user.id],
        );
      },
    },
  },
  session: {
    modelName: "auth_sessions",
    expiresIn: 60 * 60 * 8,
    updateAge: 60 * 60,
    freshAge: 60 * 15,
    cookieCache: { enabled: false },
  },
  account: { modelName: "auth_accounts" },
  verification: { modelName: "auth_verifications" },
  rateLimit: {
    enabled: true,
    storage: "database",
    modelName: "auth_rate_limits",
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
      "/sign-up/email": { window: 60 * 10, max: 3 },
      "/request-password-reset": { window: 60 * 15, max: 3 },
      "/two-factor/*": { window: 60, max: 5 },
    },
  },
  advanced: {
    useSecureCookies: isProduction,
    cookiePrefix: "snct",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: isProduction,
      path: "/",
    },
  },
  telemetry: { enabled: false },
  plugins: [
    twoFactor({
      issuer: "SNCT Paulista 2026",
      twoFactorTable: "auth_two_factors",
      twoFactorCookieMaxAge: 60 * 10,
      trustDeviceMaxAge: 60 * 60 * 24 * 14,
      accountLockout: {
        enabled: true,
        maxFailedAttempts: 5,
        durationSeconds: 60 * 15,
      },
    }),
  ],
});

type AuthUser = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  twoFactorEnabled?: boolean | null;
};

export async function getSession(): Promise<SessionData | null> {
  const headers = requestHeaders.getStore() ?? new Headers();
  const result = await auth.api.getSession({ headers });
  if (!result) return null;
  const user = result.user as typeof result.user & AuthUser;
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    emailVerified: user.emailVerified,
    mfaEnabled: Boolean(user.twoFactorEnabled),
    expiresAt: new Date(result.session.expiresAt).getTime(),
  };
}

export async function requireRole(...roles: UserRole[]) {
  const session = await getSession();
  if (!session || !roles.includes(session.role)) return null;
  if (
    (session.role === "admin" || session.role === "staff") &&
    !session.mfaEnabled
  ) {
    return null;
  }
  return session;
}

export function createVisitorHash() {
  return randomBytes(32).toString("base64url");
}

export function toPublicUser(user: PublicUser): PublicUser {
  return user;
}

export async function ensureBootstrapAdmin() {
  const email = process.env.SNCT_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SNCT_ADMIN_PASSWORD;
  if (!email || !password) return;

  const existing = await query<{ id: string; role: UserRole }>(
    `SELECT id, role FROM auth_users WHERE lower(email) = $1 LIMIT 1`,
    [email],
  );
  if (existing.rows[0]) {
    if (existing.rows[0].role !== "admin") {
      throw new Error(
        "SNCT_ADMIN_EMAIL já pertence a uma conta não administrativa.",
      );
    }
    return;
  }

  const created = await auth.api.signUpEmail({
    body: {
      email,
      password,
      name: "Administrador SNCT",
    },
  });
  if (!created.user?.id)
    throw new Error("Não foi possível criar o administrador inicial.");

  await query(
    "UPDATE auth_users SET role = 'admin', `emailVerified` = true WHERE id = $1",
    [created.user.id],
  );
}
