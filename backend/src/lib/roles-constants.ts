import type { RoleCodigo, UserRole } from "@/lib/snct-types";

export const ROLE_CODIGO_TO_AUTH: Record<RoleCodigo, UserRole> = {
  ADMINISTRADOR: "admin",
  STAFF: "staff",
  AVALIADOR: "avaliador",
  PROFESSOR: "professor",
  VISITANTE: "visitante",
  ALUNO: "aluno",
};

export const AUTH_ROLE_TO_CODIGO: Record<UserRole, RoleCodigo> = {
  admin: "ADMINISTRADOR",
  staff: "STAFF",
  avaliador: "AVALIADOR",
  professor: "PROFESSOR",
  visitante: "VISITANTE",
  aluno: "ALUNO",
};

export const PUBLIC_REGISTRATION_ROLES = [
  "AVALIADOR",
  "PROFESSOR",
  "VISITANTE",
] as const satisfies readonly RoleCodigo[];

export const CHECKIN_ELIGIBLE_ROLES = [
  "STAFF",
  "AVALIADOR",
  "PROFESSOR",
  "VISITANTE",
  "ALUNO",
] as const satisfies readonly RoleCodigo[];

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  staff: "Staff",
  avaliador: "Avaliador",
  professor: "Professor",
  visitante: "Visitante",
  aluno: "Aluno",
};

export function requiresMfa(role: UserRole) {
  return role === "admin" || role === "staff";
}

export function isPrivilegedRole(role: UserRole) {
  return requiresMfa(role);
}
