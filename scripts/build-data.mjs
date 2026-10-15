// Transforma os dados brutos (data/raw/) em pacotes leves para o navegador
// (public/data/). O site antigo baixava ~20 MB de JSON logo na abertura; aqui
// cada tela busca só o que precisa:
//
//   index.json            catálogo enxuto de todas as questões + parâmetros TRI
//   q/{id}.json           uma questão com resolução e nota editorial
//   tri.json              método e quadratura usados na estimativa
//   percentiles.json      distribuição nacional de notas (INEP)
//   sisu/index.json       busca de cursos (nome, sigla, cidade, corte AC)
//   sisu/i/{inst}.json    detalhes dos cursos de uma instituição
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const RAW = path.join(process.cwd(), "data", "raw");
const OUT = path.join(process.cwd(), "public", "data");

const read = async (f) => JSON.parse(await readFile(path.join(RAW, f), "utf8"));
const write = (f, data) => writeFile(path.join(OUT, f), JSON.stringify(data));

const [questions, solutions, tri, percentiles, sisu, coverage, notes] = await Promise.all([
  read("questions.json"),
  read("solutions.json"),
  read("tri.json"),
  read("percentiles.json"),
  read("sisu.json"),
  read("coverage.json"),
  read("editorial-notes.json"),
]);

await rm(OUT, { recursive: true, force: true });
await mkdir(path.join(OUT, "q"), { recursive: true });
await mkdir(path.join(OUT, "sisu", "i"), { recursive: true });

// remark-math lê "$…$" como fórmula; valores em reais ("R$ 5,00") precisam
// ser escapados para não virarem LaTeX.
const escapeCurrency = (text) =>
  text == null ? text : text.replace(/(R|US|U\$S)\$/g, "$1\\$");

const notesById = Object.fromEntries(notes.map((n) => [n.questionId, n]));
const LANG = { ingles: 1, espanhol: 2 };

// ── Questões ────────────────────────────────────────────────────────────────
const index = [];
for (const q of questions) {
  const item = tri.items[q.id] ?? null;
  const excluded = tri.excludedItems[q.id] ?? null;
  const sol = solutions[q.id] ?? null;
  const note = notesById[q.id] ?? null;

  // flags: 1 = fora da TRI, 2 = anulada, 4 = tem imagem, 8 = nota editorial
  const flags =
    (excluded || !item ? 1 : 0) |
    (excluded?.annulled || q.answer == null ? 2 : 0) |
    (q.images?.length || q.options.some((o) => o.image) ? 4 : 0) |
    (note ? 8 : 0);

  index.push([
    q.id,
    q.year,
    q.area,
    q.number,
    LANG[q.language] ?? 0,
    item ? +item.a.toFixed(5) : null,
    item ? +item.b.toFixed(5) : null,
    item ? +item.c.toFixed(5) : null,
    item?.skill ? Number(item.skill) : null,
    flags,
  ]);

  await write(`q/${q.id}.json`, {
    id: q.id,
    year: q.year,
    number: q.number,
    area: q.area,
    language: q.language,
    context: escapeCurrency(q.context),
    stem: escapeCurrency(q.stem),
    options: q.options.map((o) => ({ letter: o.letter, text: escapeCurrency(o.text), image: o.image })),
    answer: q.answer,
    skill: item?.skill ? Number(item.skill) : null,
    tri: item ? { a: item.a, b: item.b, c: item.c } : null,
    excluded: excluded ?? (item ? null : { reason: "Sem parâmetros publicados pelo INEP", annulled: false }),
    solution: sol
      ? {
          text: escapeCurrency(sol.solution),
          options: Object.fromEntries(Object.entries(sol.options ?? {}).map(([k, v]) => [k, escapeCurrency(v)])),
          sources: (sol.sources ?? []).map((s) => ({ title: s.title, url: s.url })),
        }
      : null,
    note: note ? { category: note.category, label: note.label, text: note.note } : null,
    source: { url: q.source?.originalUrl ?? null, provider: q.source?.provider ?? null },
  });
}

const years = [...new Set(questions.map((q) => q.year))].sort((a, b) => b - a);
await write("index.json", {
  version: 2,
  generatedAt: new Date().toISOString(),
  total: questions.length,
  years,
  fields: ["id", "year", "area", "number", "lang", "a", "b", "c", "skill", "flags"],
  items: index,
  coverage: { provider: coverage.provider, retrievedOn: coverage.retrievedOn, total: coverage.total },
});

// ── TRI e percentis ─────────────────────────────────────────────────────────
await write("tri.json", { source: tri.source, method: tri.method, quadrature: tri.quadrature });
await write("percentiles.json", percentiles);

// ── SISU ────────────────────────────────────────────────────────────────────
const LOWER = new Set(["de", "da", "do", "das", "dos", "e", "em", "para", "com", "a", "o", "na", "no", "à", "ao"]);
const KEEP_UPPER = new Set(["ABI", "TI", "II", "III", "IV", "EaD", "LGBT"]);
function titleCase(s) {
  return s
    .toLocaleLowerCase("pt-BR")
    .split(/(\s+|-|\/|\(|\))/)
    .map((w, i) => {
      if (!w.trim() || /^[-/()]$/.test(w)) return w;
      const up = w.toLocaleUpperCase("pt-BR");
      if (KEEP_UPPER.has(up)) return up;
      if (i > 0 && LOWER.has(w)) return w;
      return w.charAt(0).toLocaleUpperCase("pt-BR") + w.slice(1);
    })
    .join("");
}
function prettyCourse(name) {
  const abi = name.match(/^ABI\s*-\s*(.+)$/i);
  return abi ? `${titleCase(abi[1])} (ABI)` : titleCase(name);
}

const search = [];
const byInstitution = new Map();
for (const c of sisu.courses) {
  const ac = c.modalities.find((m) => m.code === "AC");
  search.push([
    c.id,
    prettyCourse(c.name),
    c.acronym,
    c.city,
    c.state,
    c.shift,
    c.degree,
    ac?.cutoff ?? null,
    c.institutionCode,
  ]);
  if (!byInstitution.has(c.institutionCode)) byInstitution.set(c.institutionCode, []);
  byInstitution.get(c.institutionCode).push({
    id: c.id,
    name: prettyCourse(c.name),
    institution: titleCase(c.institution),
    acronym: c.acronym,
    campus: titleCase(c.campus.replace(/\s+/g, " ").trim()),
    city: c.city,
    state: c.state,
    degree: c.degree,
    shift: c.shift,
    weights: c.weights,
    minimumScores: c.minimumScores,
    // [código, índice da descrição, corte, vagas, inscritos, bônus %]
    modalities: c.modalities
      .filter((m) => m.seats > 0 || m.cutoff)
      .map((m) => [m.code, m.labelIndex, m.cutoff, m.seats, m.applicants, m.bonusPercent]),
  });
}
await write("sisu/index.json", {
  year: sisu.year,
  round: sisu.round,
  source: { title: sisu.source.title, url: sisu.source.url, retrievedAt: sisu.source.retrievedAt },
  note: sisu.comparisonNote,
  fields: ["id", "name", "acronym", "city", "state", "shift", "degree", "cutoffAC", "inst"],
  courses: search,
});
// Cada arquivo de instituição carrega só as descrições de modalidade que usa.
for (const [code, courses] of byInstitution) {
  const used = [...new Set(courses.flatMap((c) => c.modalities.map((m) => m[1])))];
  const local = new Map(used.map((labelIndex, i) => [labelIndex, i]));
  for (const c of courses) for (const m of c.modalities) m[1] = local.get(m[1]);
  await write(`sisu/i/${code}.json`, {
    labels: used.map((i) => sisu.modalityLabels[i] ?? ""),
    modalityFields: ["code", "label", "cutoff", "seats", "applicants", "bonusPercent"],
    courses,
  });
}

console.log(
  `✓ ${questions.length} questões · ${sisu.courses.length} cursos SISU · ${byInstitution.size} instituições → public/data`,
);
