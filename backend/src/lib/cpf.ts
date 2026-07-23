export function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

export function isValidCpf(raw: string) {
  const cpf = onlyDigits(raw);
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calc = (base: string, factor: number) => {
    let total = 0;
    for (const digit of base) {
      total += Number(digit) * factor;
      factor -= 1;
    }
    const rest = (total * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const d1 = calc(cpf.slice(0, 9), 10);
  const d2 = calc(cpf.slice(0, 10), 11);
  return d1 === Number(cpf[9]) && d2 === Number(cpf[10]);
}

export function maskCpf(raw: string | null | undefined) {
  const cpf = onlyDigits(raw ?? "");
  if (cpf.length !== 11) return "***";
  return `***.***.*${cpf.slice(7, 9)}-${cpf.slice(9)}`;
}

export function maskEmail(email: string) {
  const [local, domain] = email.split("@");
  if (!local || !domain) return "***";
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}***@${domain}`;
}

export function maskPhone(raw: string | null | undefined) {
  const digits = onlyDigits(raw ?? "");
  if (digits.length < 8) return "***";
  return `(**) *****-${digits.slice(-4)}`;
}
