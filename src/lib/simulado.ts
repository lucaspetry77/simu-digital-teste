import { AREA_META, AREAS, type Area } from "./areas";
import type { Catalog, IndexItem, Percentiles, TriModel } from "./data";
import { fmtDuration } from "./format";
import type { Attempt, AttemptResult, Goal, NotebookState, SimConfig } from "./store";
import { estimateTheta, percentileOf, thetaToScore } from "./tri";

/** Ritmo do ENEM: ~3 min por questão (dia 2: 90 questões em 5h). */
export const SECONDS_PER_QUESTION = 180;

export function suggestedMinutes(count: number) {
  return Math.max(10, Math.round((count * SECONDS_PER_QUESTION) / 60 / 5) * 5);
}

export function presetAreas(config: Pick<SimConfig, "preset" | "areas">): Area[] {
  if (config.preset === "day1") return ["LC", "CH"];
  if (config.preset === "day2") return ["CN", "MT"];
  return config.areas;
}

export function describeConfig(config: SimConfig) {
  const areas = presetAreas(config);
  const what =
    config.preset === "day1"
      ? "1º dia · Linguagens + Humanas"
      : config.preset === "day2"
        ? "2º dia · Natureza + Matemática"
        : config.preset === "caderno"
          ? "Caderno de erros"
          : areas.length === 4
            ? "Todas as áreas"
            : areas.map((a) => AREA_META[a].short).join(" + ");
  const edition = config.year === "mix" ? "edições variadas" : `ENEM ${config.year}`;
  return { what, edition, title: config.preset === "caderno" ? what : `${what} · ${edition}` };
}

function shuffle<T>(arr: T[]) {
  const a = [...arr];
  const rnd = crypto.getRandomValues(new Uint32Array(a.length));
  for (let i = a.length - 1; i > 0; i--) {
    const j = rnd[i] % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Quantas questões cabem em cada área do simulado. */
function split(count: number, areas: Area[]) {
  const base = Math.floor(count / areas.length);
  return areas.map((area, i) => ({ area, n: base + (i < count % areas.length ? 1 : 0) }));
}

export function poolFor(catalog: Catalog, area: Area, config: Pick<SimConfig, "year" | "language">) {
  const lang = config.language === "ingles" ? 1 : 2;
  return catalog.items.filter(
    (i) =>
      i.area === area &&
      !i.annulled &&
      (config.year === "mix" || i.year === config.year) &&
      (i.lang === 0 || i.lang === lang),
  );
}

/**
 * Monta a lista de questões. Com edição fixa, mantém a ordem oficial do
 * caderno; com edições variadas, prioriza itens com parâmetros TRI (a nota
 * fica mais confiável) e ordena pelo número da questão, como na prova.
 */
export function buildItems(catalog: Catalog, config: SimConfig): { id: string; area: Area }[] {
  const out: { id: string; area: Area }[] = [];
  for (const { area, n } of split(config.count, presetAreas(config))) {
    let pool = poolFor(catalog, area, config);
    if (config.year === "mix") {
      const withTri = pool.filter((i) => !i.noTri);
      if (withTri.length >= n) pool = withTri;
    }
    const picked = (n >= pool.length ? pool : shuffle(pool).slice(0, n)).toSorted(
      (x, y) => x.number - y.number || x.year - y.year,
    );
    out.push(...picked.map((i) => ({ id: i.id, area })));
  }
  return out;
}

export function availableCount(catalog: Catalog, config: SimConfig) {
  return presetAreas(config).reduce((s, area) => s + poolFor(catalog, area, config).length, 0);
}

/* ── Correção ───────────────────────────────────────────────────────────── */

export function isCorrect(item: IndexItem | undefined, answer: string | null | undefined, key: string | null) {
  if (!item || key == null) return false;
  return answer === key;
}

/**
 * Calcula a nota por área. O gabarito vem dos arquivos de questão (já
 * carregados na tela de prova) — `keys` mapeia id → alternativa correta.
 */
export function scoreAttempt(
  attempt: Attempt,
  keys: Record<string, string | null>,
  catalog: Catalog,
  tri: TriModel,
  pct: Percentiles,
): AttemptResult {
  const areas: AttemptResult["areas"] = {};
  let correct = 0;
  let answered = 0;
  for (const area of AREAS) {
    const items = attempt.items.filter((i) => i.area === area);
    if (!items.length) continue;
    let areaCorrect = 0;
    const responses = [];
    for (const { id } of items) {
      const meta = catalog.byId.get(id);
      const choice = attempt.answers[id]?.choice ?? null;
      if (choice) answered++;
      const ok = keys[id] != null && choice === keys[id];
      if (ok) areaCorrect++;
      // em branco conta como erro; itens fora da TRI não entram na estimativa
      if (meta && !meta.noTri && meta.a != null && meta.b != null && meta.c != null) {
        responses.push({ a: meta.a, b: meta.b, c: meta.c, correct: ok });
      }
    }
    correct += areaCorrect;
    let score: number | null = null;
    let se: number | null = null;
    if (responses.length) {
      const est = estimateTheta(responses, tri);
      score = thetaToScore(est.theta, tri);
      se = est.se * tri.method.scaleSd;
    }
    areas[area] = {
      score,
      se,
      correct: areaCorrect,
      total: items.length,
      triItems: responses.length,
      percentile: score != null ? percentileOf(score, area, pct) : null,
    };
  }
  return { answered, correct, total: attempt.items.length, durationSec: attempt.elapsedSec, areas };
}

/* ── Perfil, meta e caderno ─────────────────────────────────────────────── */

export type ScoreProfile = Partial<Record<Area, { score: number; at: number; attemptId: string; items: number }>>;

/** Última nota estimada de cada área (de simulados com ao menos 5 itens TRI). */
export function scoreProfile(attempts: Attempt[]): ScoreProfile {
  const profile: ScoreProfile = {};
  const done = attempts
    .filter((a) => a.status === "done" && a.result && a.config.preset !== "caderno")
    .toSorted((x, y) => (y.finishedAt ?? 0) - (x.finishedAt ?? 0));
  for (const a of done) {
    for (const area of AREAS) {
      const r = a.result!.areas[area];
      if (!profile[area] && r?.score != null && r.triItems >= 5) {
        profile[area] = { score: r.score, at: a.finishedAt ?? a.updatedAt, attemptId: a.id, items: r.triItems };
      }
    }
  }
  return profile;
}

export type GoalProjection = {
  mean: number;
  cutoff: number | null;
  gap: number | null;
  /** áreas sem simulado — preenchidas com a média nacional */
  missing: Area[];
  scores: Record<Area | "RE", number>;
  /** quanto 10 pontos em cada área mexem na média ponderada */
  leverage: { area: Area | "RE"; per10: number }[];
  belowMinimum: (Area | "RE")[];
};

export function projectGoal(goal: Goal, profile: ScoreProfile, pct: Percentiles | null): GoalProjection {
  const missing = AREAS.filter((a) => !profile[a]);
  const scores = {
    RE: goal.redacao,
  } as Record<Area | "RE", number>;
  for (const a of AREAS) scores[a] = profile[a]?.score ?? pct?.areas[a].mean ?? 500;
  const w = goal.weights;
  const totalW = (Object.keys(scores) as (Area | "RE")[]).reduce((s, k) => s + (w[k] ?? 1), 0);
  const mean = (Object.keys(scores) as (Area | "RE")[]).reduce((s, k) => s + scores[k] * (w[k] ?? 1), 0) / totalW;
  const cutoff = goal.modality.cutoff;
  const leverage = (["MT", "CN", "CH", "LC", "RE"] as const)
    .map((area) => ({ area, per10: (10 * (w[area] ?? 1)) / totalW }))
    .toSorted((a, b) => b.per10 - a.per10);
  const belowMinimum = (Object.keys(scores) as (Area | "RE")[]).filter(
    (k) => goal.minimumScores[k] > 1 && scores[k] < goal.minimumScores[k],
  );
  return { mean, cutoff, gap: cutoff != null ? mean - cutoff : null, missing, scores, leverage, belowMinimum };
}

/* ── Painel: trajetória, histórico por área e foco ──────────────────────── */

/** Simulados que contam para a nota (entregues, fora o caderno), do mais antigo ao mais recente. */
function scoredAttempts(attempts: Attempt[]) {
  return attempts
    .filter((a) => a.status === "done" && a.result && a.config.preset !== "caderno")
    .toSorted((x, y) => (x.finishedAt ?? 0) - (y.finishedAt ?? 0));
}

/** Média simples das áreas já feitas (sem meta não há pesos nem redação). */
export function plainMean(profile: ScoreProfile) {
  const known = AREAS.flatMap((a) => (profile[a] ? [profile[a]!.score] : []));
  return known.length ? known.reduce((s, v) => s + v, 0) / known.length : null;
}

export type TrajectoryPoint = { at: number; mean: number; attempt: Attempt };

/**
 * Como a média evoluiu: depois de cada simulado, a média projetada para a
 * meta (ou a média simples, sem meta) com as notas conhecidas até ali.
 */
export function meanTrajectory(attempts: Attempt[], goal: Goal | null, pct: Percentiles | null): TrajectoryPoint[] {
  const done = scoredAttempts(attempts);
  const out: TrajectoryPoint[] = [];
  done.forEach((a, i) => {
    const profile = scoreProfile(done.slice(0, i + 1));
    const mean = goal ? projectGoal(goal, profile, pct).mean : plainMean(profile);
    if (mean != null && Object.keys(profile).length) out.push({ at: a.finishedAt ?? a.updatedAt, mean, attempt: a });
  });
  return out;
}

/** Notas de cada área ao longo do tempo (só simulados com 5+ itens TRI na área). */
export function areaHistory(attempts: Attempt[]): Record<Area, { at: number; score: number }[]> {
  const done = scoredAttempts(attempts);
  return Object.fromEntries(
    AREAS.map((area) => [
      area,
      done.flatMap((a) => {
        const r = a.result!.areas[area];
        return r?.score != null && r.triItems >= 5 ? [{ at: a.finishedAt ?? a.updatedAt, score: r.score }] : [];
      }),
    ]),
  ) as Record<Area, { at: number; score: number }[]>;
}

export type Focus = {
  area: Area;
  /** missing: ainda sem simulado · minimum: abaixo da nota mínima · weight: maior peso · lowest: menor nota */
  reason: "missing" | "minimum" | "weight" | "lowest";
};

/**
 * Onde estudar agora. Primeiro o que falta medir, depois o que reprova
 * (nota mínima); senão, a área com mais pontos possíveis na média: peso do
 * curso × espaço para crescer (até 900, onde a TRI já fica difícil de subir).
 */
export function studyFocus(goal: Goal | null, profile: ScoreProfile, pct: Percentiles | null): Focus {
  const w = (a: Area) => goal?.weights[a] ?? 1;
  const byWeight = AREAS.toSorted((x, y) => w(y) - w(x));
  const missing = byWeight.find((a) => !profile[a]);
  if (missing) return { area: missing, reason: "missing" };
  if (goal) {
    const below = projectGoal(goal, profile, pct).belowMinimum.find((k): k is Area => k !== "RE");
    if (below) return { area: below, reason: "minimum" };
  }
  const area = AREAS.toSorted((x, y) => w(y) * (900 - profile[y]!.score) - w(x) * (900 - profile[x]!.score))[0];
  const minW = Math.min(...AREAS.map(w));
  return { area, reason: w(area) > minW ? "weight" : "lowest" };
}

export type NotebookEntry = {
  id: string;
  area: Area;
  reason: "erro" | "branco" | "chute";
  chosen: string | null;
  attemptId: string;
  at: number;
  resolvedAt?: number;
};

/**
 * Caderno de erros: tudo o que foi errado, deixado em branco ou acertado no
 * chute nos simulados finalizados. A entrada mais recente de cada questão vale.
 */
export function notebookEntries(attempts: Attempt[], state: NotebookState): NotebookEntry[] {
  const map = new Map<string, NotebookEntry>();
  const done = attempts
    .filter((a) => a.status === "done")
    .toSorted((x, y) => (x.finishedAt ?? 0) - (y.finishedAt ?? 0));
  for (const a of done) {
    const keys = a.keys;
    if (!keys) continue;
    for (const { id, area } of a.items) {
      const ans = a.answers[id];
      const key = keys[id];
      if (key == null) continue;
      const choice = ans?.choice ?? null;
      const at = a.finishedAt ?? a.updatedAt;
      let reason: NotebookEntry["reason"] | null = null;
      if (!choice) reason = "branco";
      else if (choice !== key) reason = "erro";
      else if (ans?.confidence === "guess") reason = "chute";
      if (reason) map.set(id, { id, area, reason, chosen: choice, attemptId: a.id, at });
    }
  }
  return [...map.values()]
    .map((e) => {
      const resolvedAt = state[e.id]?.resolvedAt;
      return { ...e, resolvedAt: resolvedAt && resolvedAt > e.at ? resolvedAt : undefined };
    })
    .toSorted((x, y) => y.at - x.at);
}

export function attemptSummaryLine(a: Attempt) {
  const r = a.result;
  if (!r) return `${a.items.length} questões`;
  return `${r.correct}/${r.total} acertos · ${fmtDuration(r.durationSec, { short: true })}`;
}
