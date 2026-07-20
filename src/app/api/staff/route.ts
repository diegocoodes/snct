import { requireRole, toPublicUser } from "@/lib/auth";
import { updateSnctStore } from "@/lib/snct-store";
import type { StoredUser } from "@/lib/snct-types";

function normalizeQrValue(value: unknown) {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  if (trimmed.startsWith("SNCT:")) return trimmed.slice(5);
  try {
    const url = new URL(trimmed);
    return url.pathname.split("/").filter(Boolean).at(-1) ?? "";
  } catch {
    return trimmed;
  }
}

export async function POST(request: Request) {
  if (!(await requireRole("staff", "admin"))) {
    return Response.json({ error: "Não autorizado." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as Record<
    string,
    unknown
  > | null;
  const token = normalizeQrValue(body?.token);
  const action = body?.action === "gift" ? "gift" : "checkin";
  if (!token) {
    return Response.json({ error: "QR Code inválido." }, { status: 400 });
  }

  const result = await updateSnctStore<
    StoredUser | "gift-needs-checkin" | null
  >((store) => {
    const visitor = store.users.find(
      (user) => user.role === "visitor" && user.visitorHash === token,
    );
    if (!visitor) return null;
    if (action === "gift" && !visitor.checkedInAt) return "gift-needs-checkin";
    const now = new Date().toISOString();
    if (action === "checkin" && !visitor.checkedInAt) visitor.checkedInAt = now;
    if (action === "gift" && !visitor.giftDeliveredAt)
      visitor.giftDeliveredAt = now;
    return visitor;
  });

  if (!result) {
    return Response.json(
      { error: "Visitante não encontrado." },
      { status: 404 },
    );
  }
  if (result === "gift-needs-checkin") {
    return Response.json(
      { error: "Faça o check-in antes de entregar o brinde." },
      { status: 409 },
    );
  }
  return Response.json({ visitor: toPublicUser(result), action });
}
