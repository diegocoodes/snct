import { query } from "@/lib/db";
import type { RoleCodigo } from "@/lib/snct-types";

export * from "@/lib/roles-constants";

export async function getRoleByCodigo(codigo: RoleCodigo) {
  const result = await query<{
    id: number;
    codigo: RoleCodigo;
    nome: string;
  }>("SELECT id, codigo, nome FROM roles WHERE codigo = $1 LIMIT 1", [codigo]);
  return result.rows[0] ?? null;
}

export async function getRoleById(id: number) {
  const result = await query<{
    id: number;
    codigo: RoleCodigo;
    nome: string;
  }>("SELECT id, codigo, nome FROM roles WHERE id = $1 LIMIT 1", [id]);
  return result.rows[0] ?? null;
}

export async function listRoles() {
  const result = await query<{
    id: number;
    codigo: RoleCodigo;
    nome: string;
  }>("SELECT id, codigo, nome FROM roles ORDER BY id ASC");
  return result.rows.map((row) => ({
    id: row.id,
    codigo: row.codigo,
    nome: row.nome,
    exigeMfa:
      row.codigo === "ADMINISTRADOR" || row.codigo === "STAFF",
    podeCheckin: row.codigo !== "ADMINISTRADOR",
  }));
}
