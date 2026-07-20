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
import * as documents from "@/routes/documents";
import * as staff from "@/routes/staff";

const PORT = Number(process.env.PORT ?? 4001);
const frontendOrigin = process.env.BETTER_AUTH_URL ?? "http://localhost:3000";

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
        const params = Object.values(req.params);
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
    origin: [frontendOrigin, "http://127.0.0.1:3000", "http://localhost:3000"],
    credentials: true,
  }),
);

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "snct-backend" });
});

mount("post", "/api/auth/login", authLogin.POST);
mount("post", "/api/auth/logout", authLogout.POST);
mount("post", "/api/auth/register", authRegister.POST);
mount("get", "/api/auth/{*path}", authAll.GET);
mount("post", "/api/auth/{*path}", authAll.POST);
mount("post", "/api/account", account.POST);
mount("patch", "/api/account", account.PATCH);
mount("delete", "/api/account", account.DELETE);
mount("get", "/api/admin", admin.GET);
mount("post", "/api/admin", admin.POST);
mount("patch", "/api/admin", admin.PATCH);
mount("post", "/api/staff", staff.POST);
mount("get", "/api/documents/:id", documents.GET);

assertDatabaseConfigured();

const server = http.createServer(app);
server.listen(PORT, "127.0.0.1", () => {
  console.log(`SNCT backend (Express) em http://127.0.0.1:${PORT}`);
});
