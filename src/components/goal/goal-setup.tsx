"use client";

import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { MapPin, X } from "lucide-react";
import { motionTokens } from "@/components/arc/lib/motion-tokens";
import { RadioCards } from "@/components/arc/radio-cards/radio-cards";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { CheckIcon } from "@/components/icons/check";
import { GraduationCapIcon } from "@/components/icons/graduation-cap";
import { SearchIcon } from "@/components/icons/search";
import { AnimIcon, AnimIconOnMount } from "@/components/ui/anim-icon";
import { Suspense, use, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { AreaIcon } from "@/components/ui/area-icon";
import { BrowserOnly, Skeleton } from "@/components/ui/browser-only";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AREA_META, type Area } from "@/lib/areas";
import { cn } from "@/lib/cn";
import {
  loadPercentiles,
  loadSisuCourse,
  loadSisuIndex,
  modalityShortLabel,
  normalizeSearch,
  type SisuSearchEntry,
} from "@/lib/data";
import { fmtInt, fmtScore } from "@/lib/format";
import { scoreProfile } from "@/lib/simulado";
import { setGoal, useAttempts, useGoal } from "@/lib/store";
import { GoalProgress } from "./goal-progress";

const SUGGESTIONS = ["Medicina", "Direito", "Engenharia Civil", "Psicologia", "Ciência da Computação", "Enfermagem", "Arquitetura"];

export function GoalSetup() {
  return (
    <BrowserOnly fallback={<SetupSkeleton />} reason="A meta fica salva neste navegador.">
      <Suspense fallback={<SetupSkeleton />}>
        <GoalSetupInner />
      </Suspense>
    </BrowserOnly>
  );
}

function GoalSetupInner() {
  const sisu = use(loadSisuIndex());
  const goal = useGoal();
  const [editing, setEditing] = useState(!goal);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<SisuSearchEntry | null>(null);
  const [cursor, setCursor] = useState(0);
  const deferred = useDeferredValue(query);
  const inputRef = useRef<HTMLInputElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  // No celular o detalhe fica abaixo da lista: ao escolher um curso, leva a pessoa até ele.
  useEffect(() => {
    if (!selected || !window.matchMedia("(max-width: 1023px)").matches) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    detailRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }, [selected]);

  function clearQuery() {
    setQuery("");
    inputRef.current?.focus();
  }

  const results = useMemo(() => {
    const tokens = normalizeSearch(deferred).split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    const out: { c: SisuSearchEntry; score: number }[] = [];
    for (const c of sisu.courses) {
      if (!tokens.every((t) => c.haystack.includes(t))) continue;
      const name = normalizeSearch(c.name);
      let score = 0;
      if (name.startsWith(tokens[0])) score += 3;
      if (tokens.some((t) => c.acronym.toLowerCase() === t)) score += 4;
      if (tokens.every((t) => name.includes(t))) score += 1;
      out.push({ c, score });
    }
    return out
      .toSorted((a, b) => b.score - a.score || (b.c.cutoffAC ?? 0) - (a.c.cutoffAC ?? 0))
      .slice(0, 40)
      .map((x) => x.c);
  }, [deferred, sisu.courses]);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setCursor((c) => Math.min(results.length - 1, c + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setCursor((c) => Math.max(0, c - 1));
    } else if (e.key === "Enter" && results[cursor]) {
      setSelected(results[cursor]);
    } else if (e.key === "Escape") {
      setQuery("");
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 pb-24 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-[34px] leading-tight font-semibold tracking-[-0.04em] text-ink sm:text-[44px]">
          Para onde você quer ir?
        </h1>
        <p className="mt-2 text-[14.5px] leading-relaxed text-ink-3">
          Escolha um curso do SISU {sisu.year}. Usamos os pesos e a nota de corte dessa vaga para mostrar, a cada
          simulado, quanto falta e onde cada ponto vale mais.
        </p>
        {/* sem isto, depois de "Trocar de curso" não havia como voltar para a meta atual sem escolher outra */}
        {goal && editing ? (
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setSelected(null);
              setQuery("");
            }}
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-3 hover:text-ink"
          >
            <X className="size-3.5" /> Manter a meta atual ({goal.name} · {goal.acronym})
          </button>
        ) : null}
      </div>

      {goal && !editing ? (
        <div className="mt-10 space-y-4">
          <CurrentGoal />
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/painel">
              Ver no painel
              <AnimIcon icon={ArrowRightIcon} size={16} />
            </ButtonLink>
            <Button variant="secondary" onClick={() => setEditing(true)}>
              Trocar de curso
            </Button>
            <Button variant="ghost" onClick={() => setGoal(null)}>
              Remover meta
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_420px]">
          {/* Busca */}
          <div>
            <div className="overflow-hidden rounded-3xl border border-line bg-elev shadow-md transition-[border-color,box-shadow] focus-within:border-line-strong focus-within:shadow-lg">
              <div className="flex items-center gap-3 px-5">
                <AnimIcon icon={SearchIcon} size={19} play={query.length > 0} className="text-ink-3" />
                <input
                  ref={inputRef}
                  autoFocus
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setCursor(0);
                  }}
                  onKeyDown={onKeyDown}
                  placeholder="Curso, universidade ou cidade"
                  aria-label="Buscar curso no SISU"
                  className="h-14 w-full bg-transparent text-[16px] text-ink outline-none placeholder:text-ink-3"
                />
                {query ? (
                  <button
                    type="button"
                    onClick={clearQuery}
                    aria-label="Limpar busca (Esc)"
                    title="Limpar busca (Esc)"
                    className="grid size-8 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-hover hover:text-ink"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </div>
              {query ? (
                <ul
                  role="listbox"
                  aria-label="Cursos encontrados"
                  onMouseLeave={() => setCursor(-1)}
                  className="max-h-[440px] overflow-y-auto border-t border-line p-1.5"
                >
                  {/* só diz "nenhum" depois que a busca alcançou o que foi digitado */}
                  {results.length === 0 && deferred === query ? (
                    <li className="px-4 py-10 text-center text-[13.5px] text-ink-3">Nenhum curso encontrado.</li>
                  ) : null}
                  {results.map((c, i) => (
                    <li key={c.id} role="option" aria-selected={selected?.id === c.id}>
                      <button
                        type="button"
                        onMouseEnter={() => setCursor(i)}
                        onClick={() => setSelected(c)}
                        className={cn(
                          "relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left",
                          selected?.id === c.id && "bg-brand-softer",
                        )}
                      >
                        {i === cursor ? (
                          <motion.span
                            layoutId="sisu-cursor"
                            className="absolute inset-0 -z-0 rounded-2xl bg-sunken"
                            transition={motionTokens.spring.morph}
                          />
                        ) : null}
                        <span className="relative min-w-0 flex-1">
                          <span className="block truncate text-[14px] font-medium text-ink">{c.name}</span>
                          <span className="block truncate text-[12.5px] text-ink-3">
                            {c.acronym} · {c.city}/{c.state} · {c.shift}
                          </span>
                        </span>
                        <span className="relative text-right">
                          <span className="block text-[13.5px] font-medium text-ink tabular">
                            {c.cutoffAC != null ? fmtScore(c.cutoffAC) : "–"}
                          </span>
                          <span className="block text-[11px] text-ink-3">corte</span>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="border-t border-line px-4 py-4">
                  <p className="text-[12px] font-medium text-ink-3">Buscas comuns</p>
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setQuery(s)}
                        className="h-8 rounded-full border border-line px-3 text-[12.5px] text-ink-2 transition-colors hover:border-line-strong hover:bg-sunken hover:text-ink"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="mt-3 px-1 text-[12px] leading-relaxed text-ink-3">
              Fonte: {sisu.source.title} · {fmtInt(sisu.courses.length)} ofertas. {sisu.note}
            </p>
          </div>

          {/* Detalhe */}
          <div ref={detailRef} className="scroll-mt-20 lg:sticky lg:top-24 lg:self-start">
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div key={selected.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Suspense fallback={<Skeleton className="h-[520px] rounded-2xl" />}>
                    <CourseDetail
                      entry={selected}
                      defaultRedacao={goal?.redacao ?? 600}
                      onSaved={() => {
                        setEditing(false);
                        setSelected(null);
                        setQuery("");
                        // a tela encolhe para o cartão da meta; sem isto o celular ficava olhando o rodapé
                        window.scrollTo({ top: 0 });
                      }}
                    />
                  </Suspense>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Card className="flex flex-col items-center px-8 py-14 text-center">
                    <AnimIconOnMount icon={GraduationCapIcon} size={28} className="text-ink-2" />
                    <p className="mt-5 text-[15px] font-semibold text-ink">Escolha um curso na busca</p>
                    <p className="mt-1 text-[13.5px] leading-relaxed text-ink-3">
                      Você verá os pesos de cada área, as modalidades de concorrência e as notas de corte.
                    </p>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );
}

function CurrentGoal() {
  const goal = useGoal()!;
  const attempts = useAttempts();
  const pct = use(loadPercentiles());
  const profile = useMemo(() => scoreProfile(attempts), [attempts]);
  return <GoalProgress goal={goal} profile={profile} pct={pct} />;
}

function CourseDetail({
  entry,
  defaultRedacao,
  onSaved,
}: {
  entry: SisuSearchEntry;
  defaultRedacao: number;
  onSaved: () => void;
}) {
  const course = use(loadSisuCourse(entry.inst, entry.id));
  const modalities = (course?.modalities ?? []).filter((m) => m.cutoff != null);
  const [mod, setMod] = useState(modalities.find((m) => m.code === "AC")?.code ?? modalities[0]?.code);
  const [redacao, setRedacao] = useState(defaultRedacao);
  const [saved, setSaved] = useState(false);

  if (!course) return <Card className="p-6 text-[14px] text-ink-3">Não foi possível carregar este curso.</Card>;
  const totalW = (["LC", "CH", "CN", "MT", "RE"] as const).reduce((s, k) => s + (course.weights[k] ?? 1), 0);
  const maxW = Math.max(...(["LC", "CH", "CN", "MT", "RE"] as const).map((k) => course.weights[k] ?? 1));
  const chosen = modalities.find((m) => m.code === mod);

  function save() {
    if (!course || !chosen) return;
    setGoal({
      courseId: course.id,
      inst: entry.inst,
      name: course.name,
      acronym: course.acronym,
      institution: course.institution,
      city: course.city,
      state: course.state,
      shift: course.shift,
      degree: course.degree,
      weights: course.weights,
      minimumScores: course.minimumScores,
      modality: { code: chosen.code, label: chosen.label, cutoff: chosen.cutoff },
      redacao,
    });
    setSaved(true);
    setTimeout(onSaved, 900);
  }

  return (
    <Card className="overflow-hidden shadow-md">
      <div className="border-b border-line px-6 pt-6 pb-5">
        <p className="text-[12.5px] text-ink-3">{course.degree}</p>
        <h2 className="mt-1 text-[20px] leading-snug font-semibold text-ink">{course.name}</h2>
        <p className="mt-1 text-[13px] text-ink-2">{course.institution}</p>
        <p className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-3">
          <MapPin className="size-3.5" /> {course.campus} · {course.city}/{course.state} · {course.shift}
        </p>
      </div>

      <div className="space-y-6 px-6 py-5">
        <div>
          <p className="text-[13px] font-medium text-ink">Pesos de cada nota</p>
          <ul className="mt-3 space-y-2">
            {(["LC", "CH", "CN", "MT", "RE"] as const).map((k) => {
              const w = course.weights[k] ?? 1;
              return (
                <li key={k} className="flex items-center gap-3 text-[13px]">
                  {k === "RE" ? (
                    <span className="grid size-6 place-items-center rounded-md bg-sunken text-[10px] font-medium text-ink-3">RD</span>
                  ) : (
                    <AreaIcon area={k as Area} size="sm" />
                  )}
                  <span className="w-20 shrink-0 text-ink-2 sm:w-24">{k === "RE" ? "Redação" : AREA_META[k as Area].short}</span>
                  <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                    <span
                      className="block h-full rounded-full bg-brand"
                      style={{ width: `${(w / maxW) * 100}%`, background: k === "RE" ? "var(--ink-3)" : AREA_META[k as Area].color }}
                    />
                  </span>
                  <span className="shrink-0 text-right text-[12px] whitespace-nowrap text-ink-3 tabular sm:w-20">
                    {w.toLocaleString("pt-BR")} · {Math.round((w / totalW) * 100)}%
                  </span>
                </li>
              );
            })}
          </ul>
        </div>

        <div>
          <p className="text-[13px] font-medium text-ink">Modalidade de concorrência</p>
          {/* p-1: o anel de seleção e o contorno de foco dos cartões não são cortados pela rolagem */}
          <div className="mt-3 max-h-64 overflow-y-auto p-1">
            <RadioCards
              aria-label="Modalidade de concorrência"
              layout="list"
              // a modalidade só se distingue pelo fim do nome ("… · quilombolas"): nada de reticências
              wrapLabels
              value={mod ?? null}
              onValueChange={setMod}
              options={modalities.map((m) => ({
                value: m.code,
                label: modalityShortLabel(m.code, m.label),
                meta: <span className="tabular">{fmtScore(m.cutoff!)}</span>,
              }))}
            />
          </div>
        </div>

        <div>
          <div className="flex items-baseline justify-between">
            <label htmlFor="redacao" className="text-[13px] font-medium text-ink">
              Sua nota esperada na redação
            </label>
            <span className="text-[15px] font-semibold text-ink tabular">{redacao}</span>
          </div>
          <input
            id="redacao"
            type="range"
            min={0}
            max={1000}
            step={20}
            value={redacao}
            onChange={(e) => setRedacao(Number(e.target.value))}
            className="mt-3 w-full accent-[var(--brand)]"
          />
          <p className="mt-1 text-[12px] text-ink-3">O SIMU não corrige redação. Use a nota que você costuma tirar.</p>
        </div>
      </div>

      <div className="border-t border-line bg-sunken/50 px-6 py-4">
        <Button className="w-full" size="lg" onClick={save} disabled={!chosen || saved}>
          {saved ? <AnimIconOnMount icon={CheckIcon} size={16} delay={0} /> : null}
          {saved ? "Meta salva" : "Definir como minha meta"}
        </Button>
        {/* depois de salvar a tela volta para a meta atual, que já tem o "Ver no painel" */}
        <p className="mt-2 text-center text-[12px] text-ink-3">
          Dá para trocar quando quiser. <Link href="/metodologia#sisu" className="underline">Como comparamos?</Link>
        </p>
      </div>
    </Card>
  );
}

function SetupSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4 px-4 pt-10 sm:px-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full max-w-96" />
      <div className="grid grid-cols-1 gap-6 pt-6 lg:grid-cols-[minmax(0,1fr)_420px]">
        <Skeleton className="h-40 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}
