import { auth, createVisitorHash } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { query } from "@/lib/db";
import { isStrongPassword } from "@/lib/password";
import {
  assertTrustedMutation,
  enforceRateLimit,
  securityErrorResponse,
} from "@/lib/request-security";

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function POST(request: Request) {
  try {
    assertTrustedMutation(request);
    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const name = typeof body?.name === "string" ? body.name.trim() : "";
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";
    const age = Number(body?.age);
    const privacyConsent = body?.privacyConsent === true;
    const guardianConsent = body?.guardianConsent === true;

    await enforceRateLimit({
      request,
      scope: "register",
      identifier: email,
      limit: 3,
      windowSeconds: 10 * 60,
    });

    if (
      name.length < 2 ||
      !isEmail(email) ||
      !Number.isInteger(age) ||
      age < 5 ||
      age > 120 ||
      !privacyConsent
    ) {
      return Response.json(
        { error: "Revise os dados e aceite o aviso de privacidade." },
        { status: 400 },
      );
    }
    if (age < 18 && !guardianConsent) {
      return Response.json(
        { error: "O consentimento do responsável é obrigatório para menores." },
        { status: 400 },
      );
    }
    if (!isStrongPassword(password)) {
      return Response.json(
        {
          error:
            "Use pelo menos 12 caracteres, com maiúscula, minúscula, número e símbolo.",
        },
        { status: 400 },
      );
    }

    const response = await auth.api.signUpEmail({
      body: { email, password, name },
      headers: request.headers,
      asResponse: true,
    });

    if (response.ok) {
      const user = await query<{ id: string }>(
        "SELECT id FROM auth_users WHERE lower(email) = $1 LIMIT 1",
        [email],
      );
      if (user.rows[0]) {
        await query(
          `INSERT INTO snct_profiles
            (user_id, age, visitor_hash, privacy_accepted_at, privacy_version,
             guardian_consent_at, qr_expires_at)
           VALUES ($1, $2, $3, now(), $4, $5, now() + interval '1 year')
           ON CONFLICT (user_id) DO NOTHING`,
          [
            user.rows[0].id,
            age,
            createVisitorHash(),
            process.env.SNCT_PRIVACY_VERSION ?? "2026-07-20",
            age < 18 ? new Date() : null,
          ],
        );
      }
    }

    await recordAuditEvent(request, {
      action: "auth.register",
      entity: "user",
      outcome: response.ok ? "success" : "failure",
      metadata: { status: response.status, minor: age < 18 },
    });
    return response;
  } catch (error) {
    await recordAuditEvent(request, {
      action: "auth.register",
      entity: "user",
      outcome:
        error instanceof Response && error.status === 429
          ? "blocked"
          : "failure",
    }).catch(() => {});
    return securityErrorResponse(error);
  }
}
