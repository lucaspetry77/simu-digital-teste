"use client";

import { loadCatalog } from "./data";
import { buildItems, describeConfig } from "./simulado";
import { newId, saveAttempt, type Attempt, type SimConfig } from "./store";

export async function createAttempt(config: SimConfig, items?: Attempt["items"]): Promise<Attempt> {
  const catalog = await loadCatalog();
  const list = items ?? buildItems(catalog, config);
  if (!list.length) throw new Error("Nenhuma questão disponível com essa combinação.");
  const now = Date.now();
  const attempt: Attempt = {
    id: newId(),
    title: describeConfig(config).title,
    createdAt: now,
    updatedAt: now,
    config: { ...config, count: list.length },
    items: list,
    answers: {},
    current: 0,
    elapsedSec: 0,
    status: "active",
  };
  saveAttempt(attempt);
  return attempt;
}

export const QUICK_STARTS: { key: string; title: string; detail: string; config: SimConfig }[] = [
  {
    key: "rapido",
    title: "Aquecimento",
    detail: "12 questões · 36 min · 4 áreas",
    config: { preset: "area", areas: ["LC", "CH", "CN", "MT"], year: "mix", count: 12, language: "ingles", timeLimitMin: 36 },
  },
  {
    key: "mt",
    title: "Matemática",
    detail: "15 questões · 45 min",
    config: { preset: "area", areas: ["MT"], year: "mix", count: 15, language: "ingles", timeLimitMin: 45 },
  },
  {
    key: "dia2",
    title: "2º dia completo",
    detail: "90 questões · 5h",
    config: { preset: "day2", areas: ["CN", "MT"], year: 2023, count: 90, language: "ingles", timeLimitMin: 300 },
  },
];
