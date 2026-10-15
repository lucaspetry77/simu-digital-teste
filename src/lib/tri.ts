import type { Area } from "./areas";
import type { Catalog, Percentiles, TriModel } from "./data";

/**
 * Estimativa TRI pelo modelo logístico de 3 parâmetros (3PL) com EAP — o
 * mesmo tipo de cálculo do INEP, usando os parâmetros a, b, c publicados nos
 * microdados. É uma estimativa educacional: o INEP calibra a escala com a
 * prova inteira e a população real de participantes.
 */
export type TriResponse = { a: number; b: number; c: number; correct: boolean };

export function estimateTheta(responses: TriResponse[], model: TriModel) {
  const D = model.method.logisticMultiplier || 1;
  const nodes = model.quadrature;
  // log-verossimilhança em cada nó (evita underflow em provas longas)
  const logPost = nodes.map(({ theta, weight }) => {
    let ll = Math.log(Math.max(weight, 1e-300));
    for (const r of responses) {
      const p = r.c + (1 - r.c) / (1 + Math.exp(-D * r.a * (theta - r.b)));
      ll += Math.log(r.correct ? p : 1 - p);
    }
    return ll;
  });
  const max = Math.max(...logPost);
  const post = logPost.map((l) => Math.exp(l - max));
  const total = post.reduce((s, x) => s + x, 0);
  const theta = nodes.reduce((s, n, i) => s + n.theta * post[i], 0) / total;
  const variance = nodes.reduce((s, n, i) => s + (n.theta - theta) ** 2 * post[i], 0) / total;
  return { theta, se: Math.sqrt(variance) };
}

export function thetaToScore(theta: number, model: TriModel) {
  return model.method.scaleMean + model.method.scaleSd * theta;
}

/** Percentual de participantes do ENEM com nota abaixo de `score`. */
export function percentileOf(score: number, area: Area, pct: Percentiles) {
  const a = pct.areas[area];
  if (!a) return null;
  let below = 0;
  for (const bin of a.bins) {
    const max = bin.max ?? Infinity;
    if (score >= max) below += bin.count;
    else if (score > bin.min) below += (bin.count * (score - bin.min)) / (max - bin.min);
  }
  return Math.min(99.9, Math.max(0.1, (below / a.n) * 100));
}

export type Difficulty = "facil" | "media" | "dificil";
export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  facil: "Fácil",
  media: "Média",
  dificil: "Difícil",
};

export function difficultyOf(area: Area, b: number | null | undefined, catalog: Catalog): Difficulty | null {
  if (b == null) return null;
  const [lo, hi] = catalog.difficultyCuts[area];
  return b <= lo ? "facil" : b >= hi ? "dificil" : "media";
}
