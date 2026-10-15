export type Area = "LC" | "CH" | "CN" | "MT";
export const AREAS: Area[] = ["LC", "CH", "CN", "MT"];
export type Letter = "A" | "B" | "C" | "D" | "E";
export const LETTERS: Letter[] = ["A", "B", "C", "D", "E"];

export const AREA_META: Record<
  Area,
  { name: string; short: string; day: 1 | 2; color: string; soft: string; text: string }
> = {
  LC: {
    name: "Linguagens, Códigos e suas Tecnologias",
    short: "Linguagens",
    day: 1,
    color: "var(--area-lc)",
    soft: "color-mix(in oklab, var(--area-lc) 14%, transparent)",
    text: "text-lc",
  },
  CH: {
    name: "Ciências Humanas e suas Tecnologias",
    short: "Humanas",
    day: 1,
    color: "var(--area-ch)",
    soft: "color-mix(in oklab, var(--area-ch) 14%, transparent)",
    text: "text-ch",
  },
  CN: {
    name: "Ciências da Natureza e suas Tecnologias",
    short: "Natureza",
    day: 2,
    color: "var(--area-cn)",
    soft: "color-mix(in oklab, var(--area-cn) 14%, transparent)",
    text: "text-cn",
  },
  MT: {
    name: "Matemática e suas Tecnologias",
    short: "Matemática",
    day: 2,
    color: "var(--area-mt)",
    soft: "color-mix(in oklab, var(--area-mt) 14%, transparent)",
    text: "text-mt",
  },
};

/**
 * Competências da Matriz de Referência do ENEM. Cada habilidade (H1–H30) do
 * INEP pertence a uma competência; agrupar por competência dá um diagnóstico
 * que o estudante consegue ler ("Geometria", "Química"…), em vez de "H17".
 */
const COMPETENCIAS: Record<Area, { label: string; from: number; to: number }[]> = {
  MT: [
    { label: "Números e operações", from: 1, to: 5 },
    { label: "Geometria", from: 6, to: 9 },
    { label: "Grandezas e medidas", from: 10, to: 14 },
    { label: "Proporção e variação", from: 15, to: 18 },
    { label: "Álgebra e funções", from: 19, to: 23 },
    { label: "Gráficos e tabelas", from: 24, to: 26 },
    { label: "Estatística e probabilidade", from: 27, to: 30 },
  ],
  CN: [
    { label: "Ciência como construção humana", from: 1, to: 4 },
    { label: "Tecnologia no cotidiano", from: 5, to: 7 },
    { label: "Ambiente e sociedade", from: 8, to: 12 },
    { label: "Vida, saúde e ambiente", from: 13, to: 16 },
    { label: "Métodos científicos", from: 17, to: 19 },
    { label: "Física", from: 20, to: 23 },
    { label: "Química", from: 24, to: 27 },
    { label: "Biologia", from: 28, to: 30 },
  ],
  CH: [
    { label: "Cultura e identidades", from: 1, to: 5 },
    { label: "Espaço geográfico e poder", from: 6, to: 10 },
    { label: "Instituições e sociedade", from: 11, to: 15 },
    { label: "Trabalho e tecnologia", from: 16, to: 20 },
    { label: "Cidadania e democracia", from: 21, to: 25 },
    { label: "Sociedade e natureza", from: 26, to: 30 },
  ],
  LC: [
    { label: "Tecnologias da comunicação", from: 1, to: 4 },
    { label: "Língua estrangeira", from: 5, to: 8 },
    { label: "Linguagem corporal", from: 9, to: 11 },
    { label: "Arte", from: 12, to: 14 },
    { label: "Literatura", from: 15, to: 17 },
    { label: "Gêneros e sistemas simbólicos", from: 18, to: 20 },
    { label: "Argumentação", from: 21, to: 24 },
    { label: "Variação linguística", from: 25, to: 27 },
    { label: "Tecnologias da informação", from: 28, to: 30 },
  ],
};

export function competencia(area: Area, skill: number | null | undefined) {
  if (!skill) return null;
  const list = COMPETENCIAS[area];
  const i = list.findIndex((c) => skill >= c.from && skill <= c.to);
  if (i < 0) return null;
  return { code: `C${i + 1}`, label: list[i].label, skill: `H${skill}` };
}
