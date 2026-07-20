import "server-only";

import net from "node:net";

function scanWithClamAv(buffer: Buffer) {
  const host = process.env.CLAMAV_HOST;
  const port = Number(process.env.CLAMAV_PORT ?? 3310);

  if (!host) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("A análise antivírus não está configurada.");
    }
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const socket = net.createConnection({ host, port });
    const responses: Buffer[] = [];
    let settled = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (error) reject(error);
      else resolve();
    };

    socket.setTimeout(15_000, () =>
      finish(new Error("O antivírus excedeu o tempo de resposta.")),
    );
    socket.on("error", () =>
      finish(new Error("Não foi possível consultar o antivírus.")),
    );
    socket.on("data", (chunk) => responses.push(chunk));
    socket.on("end", () => {
      const result = Buffer.concat(responses).toString("utf8");
      if (result.includes("stream: OK")) finish();
      else if (result.includes("FOUND"))
        finish(new Error("O arquivo foi bloqueado pelo antivírus."));
      else
        finish(new Error("O antivírus não confirmou a segurança do arquivo."));
    });

    socket.on("connect", () => {
      socket.write("zINSTREAM\0");
      for (let offset = 0; offset < buffer.length; offset += 64 * 1024) {
        const chunk = buffer.subarray(offset, offset + 64 * 1024);
        const length = Buffer.allocUnsafe(4);
        length.writeUInt32BE(chunk.length);
        socket.write(length);
        socket.write(chunk);
      }
      socket.write(Buffer.alloc(4));
    });
  });
}

export async function assertFileIsClean(buffer: Buffer) {
  await scanWithClamAv(buffer);
}
