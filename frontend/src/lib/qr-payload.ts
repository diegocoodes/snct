/** Conteúdo do QR Code da credencial (URL para o staff abrir no celular). */
export function buildCredentialQrPayload(qrCodeHash: string, origin?: string) {
  const hash = qrCodeHash.trim();
  if (!hash) return "";

  const base =
    origin?.replace(/\/$/, "") ||
    (typeof window !== "undefined" ? window.location.origin : "") ||
    process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
    "https://snct.kaiolimapimentel.com.br";

  return `${base}/staff/checkin?qr=${encodeURIComponent(hash)}`;
}

/** Extrai o hash do QR a partir de URL, SNCT:hash ou hash puro. */
export function extractQrHash(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^SNCT:/i.test(trimmed)) return trimmed.replace(/^SNCT:/i, "").trim();

  try {
    const url = new URL(trimmed);
    const fromQuery = url.searchParams.get("qr") ?? url.searchParams.get("hash");
    if (fromQuery?.trim()) return fromQuery.trim();
    const last = url.pathname.split("/").filter(Boolean).at(-1);
    return last?.trim() ?? "";
  } catch {
    return trimmed;
  }
}
