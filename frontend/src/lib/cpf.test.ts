import { describe, expect, it } from "vitest";

import { isValidCpf, maskCpf, onlyDigits } from "./cpf";

describe("cpf", () => {
  it("valida CPF conhecido", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123")).toBe(false);
  });

  it("mascara CPF", () => {
    expect(maskCpf("52998224725")).toContain("-");
    expect(maskCpf("52998224725")).not.toContain("529");
  });

  it("extrai apenas dígitos", () => {
    expect(onlyDigits("(81) 99999-1234")).toBe("81999991234");
  });
});
