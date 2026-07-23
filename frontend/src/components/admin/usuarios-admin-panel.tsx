"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LoaderCircle, Search, UserCog } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/roles-constants";
import type { PublicUser, RoleCodigo, RoleChangeRecord } from "@/lib/snct-types";
import { secureFetch } from "@/lib/secure-fetch";

const roleOptions: RoleCodigo[] = [
  "ADMINISTRADOR",
  "STAFF",
  "AVALIADOR",
  "PROFESSOR",
  "VISITANTE",
  "ALUNO",
];

function UsuariosAdminPanel({
  initialUsers,
  selectedUser,
  roleHistory = [],
}: {
  initialUsers: PublicUser[];
  selectedUser?: PublicUser | null;
  roleHistory?: RoleChangeRecord[];
}) {
  const [users, setUsers] = useState(initialUsers);
  const [query, setQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [roleDraft, setRoleDraft] = useState<RoleCodigo>(
    selectedUser?.roleCodigo ?? "VISITANTE",
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.cpf ?? "").includes(q.replace(/\D/g, "")),
    );
  }, [users, query]);

  async function patch(action: string, body: Record<string, unknown>) {
    setLoadingId(String(body.userId ?? "x"));
    const response = await secureFetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...body }),
    });
    const result = (await response.json()) as {
      error?: string;
      user?: PublicUser;
    };
    if (!response.ok) {
      toast.error(result.error ?? "Falha na operação.");
    } else if (result.user) {
      setUsers((prev) =>
        prev.map((item) => (item.id === result.user!.id ? result.user! : item)),
      );
      toast.success("Atualizado com sucesso.");
    }
    setLoadingId(null);
  }

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="font-display text-sm tracking-[.2em] text-cyan-electric uppercase">
          Administração
        </p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-ice-white">
          Usuários
        </h1>
        <p className="mt-4 text-blue-gray">
          Pesquise, ative/desative e altere funções. Staff e administrador só
          podem ser atribuídos por aqui.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-blue-gray" />
          <Input
            className="pl-9"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por nome, e-mail ou CPF"
          />
        </div>
        <Button variant="outline" render={<Link href="/perfil" />}>
          Voltar ao painel
        </Button>
      </div>

      {selectedUser ? (
        <Card className="border-cyan-electric/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCog className="size-5 text-cyan-electric" aria-hidden />
              {selectedUser.name}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge>{ROLE_LABELS[selectedUser.role]}</Badge>
              <Badge variant={selectedUser.ativo === false ? "outline" : "default"}>
                {selectedUser.ativo === false ? "Inativo" : "Ativo"}
              </Badge>
            </div>
            <p className="text-sm text-blue-gray">{selectedUser.email}</p>
            <div className="flex flex-wrap items-center gap-3">
              <select
                className="h-11 rounded-xl border border-input bg-white/[0.035] px-3 text-sm text-ice-white"
                value={roleDraft}
                onChange={(event) =>
                  setRoleDraft(event.target.value as RoleCodigo)
                }
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              <Button
                disabled={loadingId === selectedUser.id}
                onClick={() =>
                  void patch("changeRole", {
                    userId: selectedUser.id,
                    roleCodigo: roleDraft,
                    motivo: "Alteração via painel admin",
                  })
                }
              >
                {loadingId === selectedUser.id ? (
                  <LoaderCircle className="animate-spin" aria-hidden />
                ) : null}
                Alterar função
              </Button>
              <Button
                variant="outline"
                disabled={loadingId === selectedUser.id}
                onClick={() =>
                  void patch("setActive", {
                    userId: selectedUser.id,
                    ativo: selectedUser.ativo === false,
                  })
                }
              >
                {selectedUser.ativo === false ? "Ativar" : "Desativar"}
              </Button>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium text-ice-white">
                Histórico de funções
              </p>
              <ul className="space-y-1 text-sm text-blue-gray">
                {roleHistory.length === 0 ? (
                  <li>Sem alterações registradas.</li>
                ) : (
                  roleHistory.map((item) => (
                    <li key={item.id}>
                      {new Date(item.createdAt).toLocaleString("pt-BR")} ·{" "}
                      {item.roleAnteriorCodigo ?? "—"} → {item.roleNovaCodigo}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="overflow-x-auto rounded-2xl border border-white/10">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/[0.03] text-blue-gray">
            <tr>
              <th className="px-4 py-3 font-medium">Nome</th>
              <th className="px-4 py-3 font-medium">E-mail</th>
              <th className="px-4 py-3 font-medium">Função</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((user) => (
              <tr key={user.id} className="border-t border-white/10">
                <td className="px-4 py-3 text-ice-white">{user.name}</td>
                <td className="px-4 py-3 text-blue-gray">{user.email}</td>
                <td className="px-4 py-3">
                  <Badge variant="outline">{ROLE_LABELS[user.role]}</Badge>
                </td>
                <td className="px-4 py-3">
                  {user.ativo === false ? "Inativo" : "Ativo"}
                </td>
                <td className="px-4 py-3">
                  <Button
                    size="sm"
                    variant="outline"
                    render={<Link href={`/admin/usuarios/${user.id}`} />}
                  >
                    Gerenciar
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export { UsuariosAdminPanel };
