import { describe, expect, it } from "vitest";

import {
  AUTH_ROLE_TO_CODIGO,
  PUBLIC_REGISTRATION_ROLES,
  ROLE_CODIGO_TO_AUTH,
  requiresMfa,
} from "./roles-constants";

describe("roles", () => {
  it("mapeia códigos públicos para auth roles", () => {
    for (const codigo of PUBLIC_REGISTRATION_ROLES) {
      expect(ROLE_CODIGO_TO_AUTH[codigo]).toBeTruthy();
      expect(AUTH_ROLE_TO_CODIGO[ROLE_CODIGO_TO_AUTH[codigo]]).toBe(codigo);
    }
  });

  it("exige MFA somente para admin e staff", () => {
    expect(requiresMfa("admin")).toBe(true);
    expect(requiresMfa("staff")).toBe(true);
    expect(requiresMfa("visitante")).toBe(false);
    expect(requiresMfa("aluno")).toBe(false);
  });
});
