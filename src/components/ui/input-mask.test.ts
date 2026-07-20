import { describe, expect, it } from "vitest";

import { formatCpf, formatPhone } from "../../lib/masks";

describe("máscaras de entrada", () => {
  it("formata e limita CPF", () => {
    expect(formatCpf("1234567890199")).toBe("123.456.789-01");
  });

  it("formata telefone celular", () => {
    expect(formatPhone("81987654321")).toBe("(81) 98765-4321");
  });

  it("remove caracteres não numéricos", () => {
    expect(formatPhone("(81) 3333-2222")).toBe("(81) 3333-2222");
  });
});
