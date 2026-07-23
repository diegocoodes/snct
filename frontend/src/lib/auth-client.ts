"use client";

export const authClient = {
  twoFactor: {
    getTotpUri: async () => ({ data: null, error: { message: "MFA não habilitado neste fluxo." } }),
    verifyTotp: async () => ({ data: null, error: { message: "MFA não habilitado neste fluxo." } }),
  },
};
