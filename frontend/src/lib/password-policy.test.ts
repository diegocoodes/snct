import { describe, expect, it } from "vitest";

import { isStrongPassword } from "./password-policy";

describe("isStrongPassword", () => {
  it("aceita uma senha longa com as quatro classes de caracteres", () => {
    expect(isStrongPassword("Ciencia@2026Segura")).toBe(true);
  });

  it.each([
    "Curta@1",
    "semmaiuscula@2026",
    "SEMMINUSCULA@2026",
    "SemNumero@Seguro",
    "SemSimbolo2026Seguro",
  ])("rejeita senha fora da política: %s", (password) => {
    expect(isStrongPassword(password)).toBe(false);
  });
});
