import { readNoticeDocument, readSnctStore } from "@/lib/snct-store";

export async function GET(
  _request: Request,
  context: RouteContext<"/api/documents/[id]">,
) {
  const { id } = await context.params;
  const store = await readSnctStore();
  const document = store.notices
    .flatMap((notice) => notice.documents)
    .find((item) => item.id === id);

  if (!document) {
    return Response.json(
      { error: "Documento não encontrado." },
      { status: 404 },
    );
  }

  try {
    const file = await readNoticeDocument(document.storageName);
    return new Response(new Uint8Array(file), {
      headers: {
        "Cache-Control": "no-store",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(document.name)}`,
        "Content-Security-Policy": "default-src 'none'; sandbox",
        "Content-Length": String(file.byteLength),
        "Content-Type": document.mimeType,
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json({ error: "Arquivo não encontrado." }, { status: 404 });
  }
}
