import { createReadStream } from "node:fs";
import { access } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";

const uploadsRoot =
  process.env.SNCT_UPLOADS_DIR ??
  path.join(process.cwd(), "uploads", "fotos");

export async function GET_FOTO(_request: Request, filename: string) {
  if (!/^[a-zA-Z0-9._-]+$/.test(filename) || filename.includes("..")) {
    return Response.json({ error: "Arquivo inválido." }, { status: 400 });
  }

  const filePath = path.join(uploadsRoot, filename);
  try {
    await access(filePath);
  } catch {
    return Response.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  const contentType =
    ext === ".png"
      ? "image/png"
      : ext === ".webp"
        ? "image/webp"
        : "image/jpeg";

  const stream = createReadStream(filePath);
  return new Response(Readable.toWeb(stream) as ReadableStream, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
