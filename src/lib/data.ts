import type { Area, Letter } from "./areas";

/* Tipos dos pacotes gerados por scripts/build-data.mjs */

export type IndexItem = {
  id: string;
  year: number;
  area: Area;
  number: number;
  /** 0 = comum, 1 = inglês, 2 = espanhol */
  lang: 0 | 1 | 2;
  a: number | null;
  b: number | null;
  c: number | null;
  skill: number | null;
  /** Fora da TRI (sem parâmetros ou excluída pelo INEP) */
  noTri: boolean;
  annulled: boolean;
  hasImage: boolean;
  hasNote: boolean;
};

export type Catalog = {
  total: number;
  years: number[];
  items: IndexItem[];
  byId: Map<string, IndexItem>;
  /** Percentis 33/67 do parâmetro b por área — usados para rotular dificuldade */
  difficultyCuts: Record<Area, [number, number]>;
};

export type Question = {
  id: string;
  year: number;
  number: number;
  area: Area;
  language: "ingles" | "espanhol" | null;
  context: string | null;
  stem: string;
  options: { letter: Letter; text: string; image: string | null }[];
  answer: Letter | null;
  skill: number | null;
  tri: { a: number; b: number; c: number } | null;
  excluded: { reason: string; annulled: boolean } | null;
  solution: {
    text: string;
    options: Partial<Record<Letter, string>>;
    sources: { title: string; url: string }[];
  } | null;
  note: { category: string; label: string; text: string } | null;
  source: { url: string | null; provider: string | null };
};

export type TriModel = {
  source: { title: string; url: string };
  method: { logisticMultiplier: number; scaleMean: number; scaleSd: number; warning: string };
  quadrature: { theta: number; weight: number }[];
};

export type Percentiles = {
  year: number;
  source: { title: string; url: string };
  areas: Record<Area, { n: number; mean: number; median: number; bins: { min: number; max: number | null; count: number }[] }>;
};

export type SisuSearchEntry = {
  id: string;
  name: string;
  acronym: string;
  city: string;
  state: string;
  shift: string;
  degree: string;
  cutoffAC: number | null;
  inst: number;
  /** nome + sigla + cidade sem acento, em minúsculas, para a busca */
  haystack: string;
};

export type SisuIndex = {
  year: number;
  round: string;
  source: { title: string; url: string; retrievedAt: string };
  note: string;
  courses: SisuSearchEntry[];
};

export type SisuModality = {
  code: string;
  label: string;
  cutoff: number | null;
  seats: number;
  applicants: number;
  bonusPercent: number;
};

export type SisuCourse = {
  id: string;
  name: string;
  institution: string;
  acronym: string;
  campus: string;
  city: string;
  state: string;
  degree: string;
  shift: string;
  weights: Record<Area | "RE", number>;
  minimumScores: Record<Area | "RE", number>;
  modalities: SisuModality[];
};

/* Busca com cache de promessas: estável para usar com React `use()` */

const ASSET_BASE = (process.env.NEXT_PUBLIC_ASSET_BASE ?? "https://www.simu.digital").replace(/\/$/, "");

/** Imagens das questões continuam hospedadas na origem do SIMU. */
export function assetUrl(src: string | null | undefined) {
  if (!src) return "";
  if (/^https?:\/\//.test(src)) return src;
  return `${ASSET_BASE}${src.startsWith("/") ? "" : "/"}${src}`;
}

const cache = new Map<string, Promise<unknown>>();
/** Promessa memorizada por chave — necessária para `use()` não suspender em loop. */
export function once<T>(key: string, load: () => Promise<T>): Promise<T> {
  let p = cache.get(key) as Promise<T> | undefined;
  if (!p) {
    p = load().catch((err) => {
      cache.delete(key);
      throw err;
    });
    cache.set(key, p);
  }
  return p;
}

async function getJSON<T>(path: string): Promise<T> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Não foi possível carregar ${path} (${res.status})`);
  return res.json() as Promise<T>;
}

export function loadCatalog(): Promise<Catalog> {
  return once("catalog", async () => {
    const raw = await getJSON<{
      total: number;
      years: number[];
      items: [string, number, Area, number, 0 | 1 | 2, number | null, number | null, number | null, number | null, number][];
    }>("/data/index.json");

    const items: IndexItem[] = raw.items.map(([id, year, area, number, lang, a, b, c, skill, flags]) => ({
      id,
      year,
      area,
      number,
      lang,
      a,
      b,
      c,
      skill,
      noTri: (flags & 1) !== 0,
      annulled: (flags & 2) !== 0,
      hasImage: (flags & 4) !== 0,
      hasNote: (flags & 8) !== 0,
    }));

    const difficultyCuts = {} as Catalog["difficultyCuts"];
    for (const area of ["LC", "CH", "CN", "MT"] as Area[]) {
      const bs = items
        .filter((i) => i.area === area && i.b != null)
        .map((i) => i.b as number)
        .sort((x, y) => x - y);
      difficultyCuts[area] = [bs[Math.floor(bs.length / 3)], bs[Math.floor((bs.length * 2) / 3)]];
    }

    return {
      total: raw.total,
      years: raw.years,
      items,
      byId: new Map(items.map((i) => [i.id, i])),
      difficultyCuts,
    };
  });
}

export function loadQuestion(id: string): Promise<Question> {
  return once(`q:${id}`, () => getJSON<Question>(`/data/q/${id}.json`));
}

export function loadQuestions(ids: string[]): Promise<Question[]> {
  return once(`qs:${ids.join(",")}`, () => Promise.all(ids.map(loadQuestion)));
}

export const loadTri = () => once("tri", () => getJSON<TriModel>("/data/tri.json"));
export const loadPercentiles = () => once("pct", () => getJSON<Percentiles>("/data/percentiles.json"));

const strip = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
export { strip as normalizeSearch };

export function loadSisuIndex(): Promise<SisuIndex> {
  return once("sisu", async () => {
    const raw = await getJSON<{
      year: number;
      round: string;
      source: SisuIndex["source"];
      note: string;
      courses: [string, string, string, string, string, string, string, number | null, number][];
    }>("/data/sisu/index.json");
    return {
      ...raw,
      courses: raw.courses.map(([id, name, acronym, city, state, shift, degree, cutoffAC, inst]) => ({
        id,
        name,
        acronym,
        city,
        state,
        shift,
        degree,
        cutoffAC,
        inst,
        haystack: strip(`${name} ${acronym} ${city} ${state}`),
      })),
    };
  });
}

export function loadSisuCourse(inst: number, id: string): Promise<SisuCourse | null> {
  return once(`sisu:${inst}:${id}`, async () => {
    const raw = await getJSON<{
      labels: string[];
      courses: (Omit<SisuCourse, "modalities"> & {
        modalities: [string, number, number | null, number, number, number][];
      })[];
    }>(`/data/sisu/i/${inst}.json`);
    const c = raw.courses.find((x) => x.id === id);
    if (!c) return null;
    return {
      ...c,
      modalities: c.modalities.map(([code, label, cutoff, seats, applicants, bonusPercent]) => ({
        code,
        label: raw.labels[label] ?? code,
        cutoff,
        seats,
        applicants,
        bonusPercent,
      })),
    };
  });
}

/** Rótulos curtos para as modalidades da Lei de Cotas (o texto oficial é longo). */
export function modalityShortLabel(code: string, label: string) {
  if (code === "AC") return "Ampla concorrência";
  const m = code.match(/^(LB|LI)_(EP|PPI|PCD|Q|I|PP)$/);
  if (m) {
    const renda = m[1] === "LB" ? "renda até 1 salário mínimo" : "qualquer renda";
    const grupo: Record<string, string> = {
      EP: "",
      PPI: " · pretos, pardos ou indígenas",
      PCD: " · pessoa com deficiência",
      Q: " · quilombolas",
      I: " · indígenas",
      PP: " · pretos ou pardos",
    };
    return `Escola pública · ${renda}${grupo[m[2]]}`;
  }
  return label.length > 90 ? `${label.slice(0, 88).trim()}…` : label;
}
