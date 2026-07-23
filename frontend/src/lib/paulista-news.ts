import "server-only";

import type { NewsItem } from "@/config/news";

const PAULISTA_NEWS_API =
  "https://paulista.pe.gov.br/wp-json/wp/v2/posts?per_page=9&_embed=1";

type WordpressTerm = {
  name?: string;
  taxonomy?: string;
};

type WordpressPost = {
  id?: number;
  date?: string;
  link?: string;
  title?: { rendered?: string };
  excerpt?: { rendered?: string };
  _embedded?: {
    "wp:term"?: WordpressTerm[][];
    "wp:featuredmedia"?: Array<{ source_url?: string }>;
  };
};

const namedEntities: Record<string, string> = {
  amp: "&",
  apos: "'",
  hellip: "…",
  ldquo: "“",
  lsquo: "‘",
  mdash: "—",
  nbsp: " ",
  ndash: "–",
  quot: '"',
  rdquo: "”",
  rsquo: "’",
};

function plainText(value = "") {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(x?[0-9a-f]+);/gi, (_, code: string) => {
      const radix = code.toLowerCase().startsWith("x") ? 16 : 10;
      const numericCode = code.replace(/^x/i, "");
      return String.fromCodePoint(Number.parseInt(numericCode, radix));
    })
    .replace(/&([a-z]+);/gi, (_, entity: string) => {
      return namedEntities[entity.toLowerCase()] ?? `&${entity};`;
    })
    .replace(/\s+/g, " ")
    .trim();
}

function excerpt(value?: string) {
  const text = plainText(value);
  if (text.length <= 190) return text;
  return `${text.slice(0, 187).trimEnd()}…`;
}

function formatDate(value?: string) {
  if (!value) return "Data não informada";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Data não informada";

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "America/Recife",
  })
    .format(date)
    .replace(/\./g, "");
}

function isOfficialUrl(value?: string) {
  if (!value) return false;
  try {
    return new URL(value).hostname === "paulista.pe.gov.br";
  } catch {
    return false;
  }
}

export async function getPaulistaNews(): Promise<NewsItem[]> {
  try {
    const response = await fetch(PAULISTA_NEWS_API, {
      next: { revalidate: 300 },
      headers: { "User-Agent": "SNCT-Paulista/1.0" },
      signal: AbortSignal.timeout(5_000),
    });

    if (!response.ok) return [];

    const posts = (await response.json()) as WordpressPost[];

    return posts.flatMap((post) => {
      if (!post.id || !isOfficialUrl(post.link)) return [];

      const terms = post._embedded?.["wp:term"]?.flat() ?? [];
      const category =
        terms.find((term) => term.taxonomy === "category")?.name ?? "Notícias";
      const imageUrl = post._embedded?.["wp:featuredmedia"]?.[0]?.source_url;

      return [
        {
          id: post.id,
          category: plainText(category),
          date: formatDate(post.date),
          title: plainText(post.title?.rendered),
          excerpt: excerpt(post.excerpt?.rendered),
          url: post.link!,
          imageUrl: isOfficialUrl(imageUrl) ? imageUrl : undefined,
        },
      ];
    });
  } catch {
    return [];
  }
}
