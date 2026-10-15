"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { Area, Letter } from "./areas";

/**
 * Tudo fica no localStorage deste navegador: sem conta, sem servidor, sem
 * coleta. O estudante pode exportar/importar um arquivo para trocar de
 * aparelho (veja /painel).
 */

export type Confidence = "sure" | "unsure" | "guess";

export type AnswerState = {
  choice: Letter | null;
  confidence?: Confidence;
  eliminated?: Letter[];
  flagged?: boolean;
  timeSec?: number;
  /** trechos destacados com o marca-texto: [início, fim] em caracteres */
  marks?: [number, number][];
};

export type Preset = "area" | "day1" | "day2" | "caderno";

export type SimConfig = {
  preset: Preset;
  areas: Area[];
  year: number | "mix";
  count: number;
  language: "ingles" | "espanhol";
  timeLimitMin: number | null;
};

export type AreaResult = {
  score: number | null;
  se: number | null;
  correct: number;
  total: number;
  triItems: number;
  percentile: number | null;
};

export type AttemptResult = {
  answered: number;
  correct: number;
  total: number;
  durationSec: number;
  areas: Partial<Record<Area, AreaResult>>;
};

export type Attempt = {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  config: SimConfig;
  items: { id: string; area: Area }[];
  answers: Record<string, AnswerState>;
  current: number;
  elapsedSec: number;
  status: "active" | "done";
  finishedAt?: number;
  result?: AttemptResult;
  /** gabarito congelado ao entregar (alimenta o caderno de erros sem refazer downloads) */
  keys?: Record<string, string | null>;
};

export type Prefs = {
  theme: "system" | "light" | "dark";
  readingSize: number;
  hideTimer: boolean;
  askConfidence: boolean;
};

export type Goal = {
  courseId: string;
  inst: number;
  name: string;
  acronym: string;
  institution: string;
  city: string;
  state: string;
  shift: string;
  degree: string;
  weights: Record<Area | "RE", number>;
  minimumScores: Record<Area | "RE", number>;
  modality: { code: string; label: string; cutoff: number | null };
  redacao: number;
  setAt: number;
};

export type NotebookState = Record<string, { resolvedAt?: number }>;

const KEYS = {
  attempts: "simu:attempts",
  prefs: "simu:prefs",
  goal: "simu:goal",
  notebook: "simu:notebook",
} as const;

export const DEFAULT_PREFS: Prefs = {
  theme: "system",
  readingSize: 17,
  hideTimer: false,
  askConfidence: true,
};
const EMPTY_ATTEMPTS: Attempt[] = [];
const EMPTY_NOTEBOOK: NotebookState = {};

/* ── Pequeno store sobre o localStorage ─────────────────────────────────── */

const listeners = new Set<() => void>();
const snapshots = new Map<string, { raw: string | null; value: unknown }>();

function emit() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith("simu:")) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function read<T>(key: string, fallback: T): T {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(key);
  } catch {
    return fallback;
  }
  const snap = snapshots.get(key);
  if (snap && snap.raw === raw) return snap.value as T;
  let value: T = fallback;
  if (raw != null) {
    try {
      value = JSON.parse(raw) as T;
    } catch {
      value = fallback;
    }
  }
  snapshots.set(key, { raw, value });
  return value;
}

function write<T>(key: string, value: T | null) {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // armazenamento cheio ou bloqueado: a sessão continua em memória
  }
  emit();
}

function useStored<T>(key: string, fallback: T): T {
  return useSyncExternalStore(
    subscribe,
    () => read(key, fallback),
    () => fallback,
  );
}

/* ── Simulados ──────────────────────────────────────────────────────────── */

export const useAttempts = () => useStored<Attempt[]>(KEYS.attempts, EMPTY_ATTEMPTS);
export const getAttempts = () => read<Attempt[]>(KEYS.attempts, EMPTY_ATTEMPTS);
export const getAttempt = (id: string) => getAttempts().find((a) => a.id === id) ?? null;

export function useAttempt(id: string | null) {
  const all = useAttempts();
  return id ? (all.find((a) => a.id === id) ?? null) : null;
}

export function saveAttempt(attempt: Attempt) {
  const all = getAttempts();
  const i = all.findIndex((a) => a.id === attempt.id);
  const next = i >= 0 ? all.map((a) => (a.id === attempt.id ? attempt : a)) : [attempt, ...all];
  write(KEYS.attempts, next);
}

export function deleteAttempt(id: string) {
  write(
    KEYS.attempts,
    getAttempts().filter((a) => a.id !== id),
  );
}

export function newId() {
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}

/* ── Preferências ───────────────────────────────────────────────────────── */

export function usePrefs(): Prefs {
  const stored = useStored<Partial<Prefs>>(KEYS.prefs, DEFAULT_PREFS);
  return useMemo(() => (stored === DEFAULT_PREFS ? DEFAULT_PREFS : { ...DEFAULT_PREFS, ...stored }), [stored]);
}

export function setPrefs(patch: Partial<Prefs>) {
  const next = { ...DEFAULT_PREFS, ...read<Partial<Prefs>>(KEYS.prefs, {}), ...patch };
  write(KEYS.prefs, next);
  applyPrefs(next);
}

export function applyPrefs(p: Prefs) {
  const root = document.documentElement;
  const theme =
    p.theme === "system" ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : p.theme;
  root.setAttribute("data-theme", theme);
  root.style.setProperty("--reading-size", `${p.readingSize}px`);
}

/* ── Meta (curso no SISU) ───────────────────────────────────────────────── */

export const useGoal = () => useStored<Goal | null>(KEYS.goal, null);
export const setGoal = (goal: Omit<Goal, "setAt"> | null) =>
  write(KEYS.goal, goal ? { ...goal, setAt: Date.now() } : null);

/* ── Caderno de erros ───────────────────────────────────────────────────── */

export const useNotebookState = () => useStored<NotebookState>(KEYS.notebook, EMPTY_NOTEBOOK);

export function resolveNotebookItems(ids: string[]) {
  const state = { ...read<NotebookState>(KEYS.notebook, EMPTY_NOTEBOOK) };
  const now = Date.now();
  for (const id of ids) state[id] = { resolvedAt: now };
  write(KEYS.notebook, state);
}

export function reopenNotebookItem(id: string) {
  const state = { ...read<NotebookState>(KEYS.notebook, EMPTY_NOTEBOOK) };
  delete state[id];
  write(KEYS.notebook, state);
}

/* ── Backup ─────────────────────────────────────────────────────────────── */

export function exportBackup() {
  return {
    app: "simu",
    version: 2,
    exportedAt: new Date().toISOString(),
    attempts: getAttempts(),
    goal: read<Goal | null>(KEYS.goal, null),
    notebook: read<NotebookState>(KEYS.notebook, EMPTY_NOTEBOOK),
    prefs: read<Partial<Prefs>>(KEYS.prefs, {}),
  };
}

export function importBackup(data: unknown) {
  const d = data as ReturnType<typeof exportBackup>;
  if (!d || d.app !== "simu" || !Array.isArray(d.attempts)) throw new Error("Arquivo de backup inválido.");
  const known = new Set(getAttempts().map((a) => a.id));
  write(KEYS.attempts, [...getAttempts(), ...d.attempts.filter((a) => !known.has(a.id))]);
  if (d.goal) write(KEYS.goal, d.goal);
  if (d.notebook) write(KEYS.notebook, { ...read(KEYS.notebook, EMPTY_NOTEBOOK), ...d.notebook });
  return d.attempts.length;
}

export function clearAll() {
  for (const k of Object.values(KEYS)) write(k, null);
}
