import { auth } from "@/lib/auth";
import { recordAuditEvent } from "@/lib/audit";
import { isStrongPassword } from "@/lib/password";

const protectedByApplicationRoutes = new Set([
  "/api/auth/sign-up/email",
  "/api/auth/sign-in/email",
  "/api/auth/sign-out",
  "/api/auth/delete-user",
]);

export async function GET(request: Request) {
  return auth.handler(request);
}

export async function POST(request: Request) {
  const pathname = new URL(request.url).pathname;
  if (protectedByApplicationRoutes.has(pathname)) {
    return Response.json({ error: "Rota indisponível." }, { status: 404 });
  }

  if (pathname === "/api/auth/reset-password") {
    const body = (await request
      .clone()
      .json()
      .catch(() => null)) as {
      newPassword?: unknown;
    } | null;
    if (
      typeof body?.newPassword !== "string" ||
      !isStrongPassword(body.newPassword)
    ) {
      return Response.json(
        {
          error:
            "Use pelo menos 12 caracteres, com maiúscula, minúscula, número e símbolo.",
        },
        { status: 400 },
      );
    }
  }

  const response = await auth.handler(request);
  if (
    pathname.includes("/two-factor/") ||
    pathname.includes("password") ||
    pathname.includes("verification")
  ) {
    await recordAuditEvent(request, {
      action: `auth${pathname.replace("/api/auth", "")}`,
      entity: "authentication",
      outcome: response.ok
        ? "success"
        : response.status === 429
          ? "blocked"
          : "failure",
      metadata: { status: response.status },
    }).catch(() => {});
  }
  return response;
}
