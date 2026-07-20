export type Partner = {
  id?: string;
  name: string;
  logo: string;
};

export const partners = [
  {
    name: "SESI — Serviço Social da Indústria",
    logo: "https://snct.paulista.pe.gov.br/parceiros/parc_359dfffd1e13.png",
  },
  {
    name: "Senac",
    logo: "https://snct.paulista.pe.gov.br/parceiros/parc_57eecf017e0e.png",
  },
  {
    name: "Governo de Pernambuco",
    logo: "https://snct.paulista.pe.gov.br/parceiros/parc_2b05a80f020c.png",
  },
  {
    name: "Secretaria de Meio Ambiente — Prefeitura do Paulista",
    logo: "https://snct.paulista.pe.gov.br/parceiros/parc_62a698c1c1a2.png",
  },
  {
    name: "Instituto Federal de Pernambuco — Campus Paulista",
    logo: "https://snct.paulista.pe.gov.br/parceiros/parc_c402be0be8d4.png",
  },
  {
    name: "CNPq",
    logo: "https://snct.paulista.pe.gov.br/parceiros/parc_57ecb7c6984e.png",
  },
  {
    name: "Ministério da Ciência, Tecnologia e Inovação",
    logo: "https://snct.paulista.pe.gov.br/parceiros/parc_ed6b29e85d5a.png",
  },
  {
    name: "Sebrae",
    logo: "https://snct.paulista.pe.gov.br/parceiros/parc_56f8288de278.png",
  },
] as const satisfies readonly Partner[];
