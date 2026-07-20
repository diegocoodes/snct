import process from "node:process";

const required = [
  "DATABASE_URL",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "SNCT_RATE_LIMIT_SECRET",
  "SNCT_DATA_ENCRYPTION_KEYS",
  "SNCT_ADMIN_EMAIL",
  "SNCT_ADMIN_PASSWORD",
  "SNCT_SMTP_HOST",
  "SNCT_SMTP_USER",
  "SNCT_SMTP_PASSWORD",
  "SNCT_EMAIL_FROM",
  "CLAMAV_HOST",
];

const missing = required.filter((name) => !process.env[name]?.trim());
const encryptionEntries =
  process.env.SNCT_DATA_ENCRYPTION_KEYS?.split(",") ?? [];
const encryptionVersions = encryptionEntries.map(
  (entry) => entry.trim().split(":", 2)[0],
);
const strongPassword = (value) =>
  value.length >= 12 &&
  value.length <= 128 &&
  /[a-z]/.test(value) &&
  /[A-Z]/.test(value) &&
  /\d/.test(value) &&
  /[^A-Za-z0-9]/.test(value);

if (missing.length) {
  console.error(`Variáveis obrigatórias ausentes: ${missing.join(", ")}`);
  process.exitCode = 1;
} else if ((process.env.BETTER_AUTH_SECRET?.length ?? 0) < 32) {
  console.error("BETTER_AUTH_SECRET precisa ter pelo menos 32 caracteres.");
  process.exitCode = 1;
} else if ((process.env.SNCT_RATE_LIMIT_SECRET?.length ?? 0) < 32) {
  console.error("SNCT_RATE_LIMIT_SECRET precisa ter pelo menos 32 caracteres.");
  process.exitCode = 1;
} else if (
  process.env.BETTER_AUTH_SECRET === process.env.SNCT_RATE_LIMIT_SECRET
) {
  console.error(
    "Os segredos de autenticação e rate limiting precisam ser diferentes.",
  );
  process.exitCode = 1;
} else if (!strongPassword(process.env.SNCT_ADMIN_PASSWORD ?? "")) {
  console.error(
    "SNCT_ADMIN_PASSWORD precisa ter 12+ caracteres, maiúscula, minúscula, número e símbolo.",
  );
  process.exitCode = 1;
} else if (
  !encryptionEntries.every((entry) => {
    const [version, encoded] = entry.trim().split(":", 2);
    return (
      /^\d+$/.test(version) &&
      Buffer.from(encoded ?? "", "base64").length === 32
    );
  })
) {
  console.error("SNCT_DATA_ENCRYPTION_KEYS possui formato ou chave inválida.");
  process.exitCode = 1;
} else if (new Set(encryptionVersions).size !== encryptionVersions.length) {
  console.error("SNCT_DATA_ENCRYPTION_KEYS não pode repetir versões.");
  process.exitCode = 1;
} else if (!process.env.BETTER_AUTH_URL?.startsWith("https://")) {
  console.error("BETTER_AUTH_URL precisa usar HTTPS em produção.");
  process.exitCode = 1;
} else {
  console.log("Configuração mínima de produção validada.");
}
