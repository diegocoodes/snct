export type HeroIndicator = {
  value: string;
  label: string;
};

export const heroIndicators = [
  { value: "20+", label: "Atividades" },
  { value: "10+", label: "Palestrantes" },
  { value: "Certificado", label: "de participação" },
] as const satisfies readonly HeroIndicator[];
