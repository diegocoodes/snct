import http from "node:http";

import { fromNodeHeaders } from "better-auth/node";
import cors from "cors";
import express from "express";

import { requestHeaders } from "@/lib/auth";
import { assertDatabaseConfigured } from "@/lib/db";
import {
  absoluteUrl,
  sendFetchResponse,
  toFetchRequest,
} from "@/http/fetch-bridge";
import * as account from "@/routes/account";
import * as admin from "@/routes/admin";
import * as authAll from "@/routes/auth-all";
import * as authLogin from "@/routes/auth-login";
import * as authLogout from "@/routes/auth-logout";
import * as authRegister from "@/routes/auth-register";
import * as checkins from "@/routes/checkins";
import * as credencial from "@/routes/credencial";
import * as documents from "@/routes/documents";
import * as professor from "@/routes/professor";
import * as registro from "@/routes/registro";
import * as staff from "@/routes/staff";
import * as uploads from "@/routes/uploads";

const PORT = Number(process.env.PORT ?? 4101);
const HOST = process.env.HOST ?? "0.0.0.0";
const frontendOrigin = process.env.BETTER_AUTH_URL ?? "http://localhost:4100";
const trustedOrigins = [
  frontendOrigin,
  "http://127.0.0.1:4100",
  "http://localhost:4100",
  ...(process.env.SNCT_TRUSTED_ORIGINS?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []),
];

type FetchHandler = (request: Request, ...args: string[]) => Promise<Response>;

function mount(
  method: "get" | "post" | "put" | "patch" | "delete" | "all",
  path: string,
  handler: FetchHandler,
) {
  app[method](path, (req, res) => {
    void (async () => {
      try {
        const url = absoluteUrl(
          req,
          req.originalUrl.startsWith("/")
            ? req.originalUrl
            : `/${req.originalUrl}`,
        );
        const request = await toFetchRequest(req, url);
        const headers = fromNodeHeaders(req.headers);
        const params = Object.values(req.params).flatMap((value) =>
          Array.isArray(value) ? value : [value],
        );
        const response = await requestHeaders.run(headers, () =>
          handler(request, ...params),
        );
        await sendFetchResponse(response, res);
      } catch (error) {
        console.error(error);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Erro interno do servidor." }));
        }
      }
    })();
  });
}

const app = express();
app.disable("x-powered-by");
app.use(
  cors({
    origin: [...new Set(trustedOrigins)],
    credentials: true,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "snct-backend" });
});

mount("post", "/api/auth/login", authLogin.POST);
mount("post", "/api/auth/logout", authLogout.POST);
mount("post", "/api/auth/register", authRegister.POST);
mount("post", "/api/auth/registro/avaliador", registro.POST_AVALIADOR);
mount("post", "/api/auth/registro/professor", registro.POST_PROFESSOR);
mount("post", "/api/auth/registro/visitante", registro.POST_VISITANTE);
mount("post", "/api/credencial/visitante", credencial.POST_VISITANTE_CPF);
mount("get", "/api/auth/{*path}", authAll.GET);
mount("post", "/api/auth/{*path}", authAll.POST);
mount("post", "/api/account", account.POST);
mount("patch", "/api/account", account.PATCH);
mount("delete", "/api/account", account.DELETE);
mount("get", "/api/admin", admin.GET);
mount("post", "/api/admin", admin.POST);
mount("patch", "/api/admin", admin.PATCH);
mount("post", "/api/staff", staff.POST);
mount("get", "/api/professor", professor.GET);
mount("post", "/api/professor", professor.POST);
mount("delete", "/api/professor", professor.DELETE);
mount("get", "/api/checkins/participantes", checkins.GET_PARTICIPANTES);
mount("get", "/api/checkins/buscar", checkins.GET_BUSCAR);
mount("get", "/api/checkins/usuario/:usuarioId/historico", (request, usuarioId) =>
  checkins.GET_HISTORICO(request, usuarioId),
);
mount("get", "/api/checkins/usuario/:qrCodeHash", (request, qrCodeHash) =>
  checkins.GET_POR_QR(request, qrCodeHash),
);
mount("post", "/api/checkins", checkins.POST_CHECKIN);
mount("get", "/api/uploads/fotos/:filename", (request, filename) =>
  uploads.GET_FOTO(request, filename),
);
mount("get", "/api/documents/:id", documents.GET);

assertDatabaseConfigured();

const server = http.createServer(app);
server.listen(PORT, HOST, () => {
  console.log(`SNCT backend (Express) em http://${HOST}:${PORT}`);
});
