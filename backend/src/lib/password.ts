import { hash, verify } from "@node-rs/argon2";
export { isStrongPassword } from "@/lib/password-policy";

const argonOptions = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
  outputLen: 32,
} as const;

export function hashPassword(password: string) {
  return hash(password, argonOptions);
}

export function verifyPassword(passwordHash: string, password: string) {
  return verify(passwordHash, password);
}
