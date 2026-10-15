"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, Info, Lightbulb, Shuffle } from "lucide-react";
import { use, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { MorphSelect } from "@/components/arc/morph-select/morph-select";
import { motionTokens } from "@/components/arc/lib/motion-tokens";
import { RadioCards } from "@/components/arc/radio-cards/radio-cards";
import { ArrowLeftIcon } from "@/components/icons/arrow-left";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { CalendarDaysIcon } from "@/components/icons/calendar-days";
import { EyeOffIcon } from "@/components/icons/eye-off";
import { HourglassIcon } from "@/components/icons/hourglass";
import { TimerIcon } from "@/components/icons/timer";
import { AnimIcon } from "@/components/ui/anim-icon";
import { AreaGlyph, AreaIcons } from "@/components/ui/area-icon";
import { BrowserOnly } from "@/components/ui/browser-only";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import type { Area } from "@/lib/areas";
import { cn } from "@/lib/cn";
import { loadCatalog } from "@/lib/data";
import { fmtDuration, fmtInt } from "@/lib/format";
import { availableCount, describeConfig, poolFor, presetAreas, suggestedMinutes } from "@/lib/simulado";
import { createAttempt } from "@/lib/start";
import type { Preset, SimConfig } from "@/lib/store";

const YEARS = [2023, 2022, 2021, 2020, 2019, 2018, 2017, 2016, 2015, 2014, 2013, 2012, 2011, 2010, 2009];

type Choice = { key: string; preset: Preset; areas: Area[]; title: string; detail: string };
const CHOICES: Choice[] = [
  { key: "MT", preset: "area", areas: ["MT"], title: "Matemática", detail: "Álgebra, geometria, estatística" },
  { key: "CN", preset: "area", areas: ["CN"], title: "Ciências da Natureza", detail: "Física, química e biologia" },
  { key: "CH", preset: "area", areas: ["CH"], title: "Ciências Humanas", detail: "História, geografia, filosofia" },
  { key: "LC", preset: "area", areas: ["LC"], title: "Linguagens", detail: "Português, literatura, artes, língua estrangeira" },
  { key: "day1", preset: "day1", areas: ["LC", "CH"], title: "1º dia de prova", detail: "Linguagens e Humanas" },
  { key: "day2", preset: "day2", areas: ["CN", "MT"], title: "2º dia de prova", detail: "Natureza e Matemática" },
];

const AREA_COUNTS = [5, 10, 15, 30, 45];
const DAY_COUNTS = [10, 20, 30, 90];
const countsFor = (preset: Preset) => (preset === "area" ? AREA_COUNTS : DAY_COUNTS);

type TimeMode = "enem" | "folga" | "livre";
type Language = "ingles" | "espanhol";
type Edition = "mix" | "single";
type StepId = "treino" | "edicao" | "quantidade" | "tempo" | "lingua" | "revisao";

const TIME_LABEL: Record<TimeMode, string> = { enem: "Ritmo do ENEM", folga: "Com folga", livre: "Sem cronômetro" };
const LANGUAGE_LABEL: Record<Language, string> = { ingles: "Inglês", espanhol: "Espanhol" };

const STEP_COPY: Record<StepId, { title: string; hint: string }> = {
  treino: {
    title: "O que você quer treinar?",
    hint: "Questões oficiais do ENEM, corrigidas na hora com nota estimada pela TRI.",
  },
  edicao: { title: "De qual prova?", hint: "Misturar edições dá uma visão mais ampla do que costuma cair." },
  quantidade: { title: "Quantas questões?", hint: "O tempo ao lado segue o ritmo do ENEM, 3 minutos por questão." },
  tempo: { title: "E o relógio?", hint: "Em qualquer modo dá para pausar e continuar depois, o progresso fica salvo." },
  lingua: {
    title: "Qual língua estrangeira?",
    hint: "As questões 1 a 5 de Linguagens são em inglês ou espanhol, como na inscrição.",
  },
  revisao: { title: "Tudo pronto?", hint: "Confira o seu simulado. Dá para mudar qualquer item antes de começar." },
};

/** Quanto tempo a seleção fica à vista (o anel desliza até o cartão) antes de passar para a próxima etapa. */
const AUTO_ADVANCE_MS = 340;

type Bezier = [number, number, number, number];
const STEP_MOTION: Variants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 28, filter: `blur(${motionTokens.blur.soft}px)` }),
  center: { opacity: 1, x: 0, filter: "blur(0px)", transition: motionTokens.spring.smooth },
  exit: (dir: number) => ({
    opacity: 0,
    x: dir * -20,
    filter: `blur(${motionTokens.blur.soft}px)`,
    transition: { duration: motionTokens.duration.exit, ease: [...motionTokens.ease.exit] as Bezier },
  }),
};

/** Links podem pré-preencher etapas (?treino=MT&ano=2023&n=15); o que faltar começa em branco. */
function initialState(params: URLSearchParams) {
  const choice = CHOICES.find((c) => c.key === params.get("treino")) ?? null;
  const ano = params.get("ano");
  const year = ano && YEARS.includes(Number(ano)) ? Number(ano) : null;
  const edition: Edition | null = ano === "mix" ? "mix" : year ? "single" : null;
  const n = Number(params.get("n"));
  const count = choice && countsFor(choice.preset).includes(n) ? n : null;
  const step: StepId = !choice ? "treino" : !edition ? "edicao" : !count ? "quantidade" : "tempo";
  return { choice: choice?.key ?? null, edition, year, count, step };
}

export function Builder() {
  const params = useSearchParams();
  const init = useMemo(() => initialState(params), [params]);
  const [choiceKey, setChoiceKey] = useState<string | null>(init.choice);
  const [edition, setEdition] = useState<Edition | null>(init.edition);
  const [year, setYear] = useState<number | null>(init.year);
  const [count, setCount] = useState<number | null>(init.count);
  const [timeMode, setTimeMode] = useState<TimeMode | null>(null);
  const [language, setLanguage] = useState<Language | null>(null);
  const [stepId, setStepId] = useState<StepId>(init.step);
  const [dir, setDir] = useState(1);
  // veio do "Alterar" da revisão: ao responder, volta direto para a revisão em vez de refazer o caminho todo
  const [fromReview, setFromReview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const reduced = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);

  const choice = CHOICES.find((c) => c.key === choiceKey) ?? null;
  const counts = choice ? countsFor(choice.preset) : AREA_COUNTS;
  const fullCount = choice?.preset === "area" ? 45 : 90;
  const hasLC = choice ? presetAreas(choice).includes("LC") : false;
  const baseCount = count ?? counts[1];
  const enemMin = suggestedMinutes(baseCount);
  const folgaMin = Math.round((enemMin * 1.5) / 5) * 5;
  const minutes = timeMode === "livre" ? null : timeMode === "folga" ? folgaMin : enemMin;

  const steps: StepId[] = hasLC
    ? ["treino", "edicao", "quantidade", "tempo", "lingua", "revisao"]
    : ["treino", "edicao", "quantidade", "tempo", "revisao"];
  const questions = steps.slice(0, -1);
  const done: Record<StepId, boolean> = {
    treino: choice !== null,
    edicao: edition === "mix" || (edition === "single" && year !== null),
    quantidade: count !== null && counts.includes(count),
    tempo: timeMode !== null,
    lingua: !hasLC || language !== null,
    revisao: false,
  };
  const firstOpen = questions.find((s) => !done[s]) ?? "revisao";
  // nunca deixa pular uma etapa sem resposta (ex.: trocar de área invalida a quantidade escolhida)
  const current =
    !steps.includes(stepId) || steps.indexOf(stepId) > steps.indexOf(firstOpen) ? firstOpen : stepId;
  const index = steps.indexOf(current);

  const summary: Partial<Record<StepId, string>> = {
    treino: choice?.title,
    edicao: edition === "mix" ? "Edições variadas" : year ? `ENEM ${year}` : undefined,
    quantidade: count ? `${count} questões` : undefined,
    tempo: timeMode ? TIME_LABEL[timeMode] : undefined,
    lingua: language ? LANGUAGE_LABEL[language] : undefined,
  };

  const config: SimConfig | null =
    choice && firstOpen === "revisao" && count
      ? {
          preset: choice.preset,
          areas: choice.areas,
          year: edition === "single" && year ? year : "mix",
          count,
          language: language ?? "ingles",
          timeLimitMin: minutes,
        }
      : null;

  const timer = useRef<number | undefined>(undefined);
  function clearTimer() {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  }

  function goTo(target: StepId) {
    setDir(steps.indexOf(target) < index ? -1 : 1);
    setStepId(target);
    if (target === "revisao") setFromReview(false);
  }

  function edit(target: StepId) {
    setFromReview(true);
    goTo(target);
  }

  /** `auto` é o avanço depois de um clique: "Uma edição só" ainda pede o ano, então ali ele espera. */
  function next(auto = false) {
    if (current === "revisao" || !done[current]) return;
    if (auto && current === "edicao" && edition !== "mix") return;
    goTo(fromReview ? firstOpen : steps[index + 1]);
  }

  // o temporizador do avanço automático lê sempre o estado mais recente, não o do clique
  const nextRef = useRef(next);
  useEffect(() => {
    nextRef.current = next;
  });

  function schedule(delay: number, auto: boolean) {
    clearTimer();
    timer.current = window.setTimeout(() => {
      timer.current = undefined;
      nextRef.current(auto);
    }, delay);
  }

  // trocar de etapa por qualquer caminho cancela um avanço automático que ainda esteja na fila
  useEffect(() => () => window.clearTimeout(timer.current), [current]);

  function onCardClick(e: React.MouseEvent) {
    const card = (e.target as HTMLElement).closest('[role="radio"]');
    if (card && card.getAttribute("aria-disabled") !== "true") schedule(AUTO_ADVANCE_MS, true);
  }

  // Enter continua, exceto onde a tecla já tem dono (botões, links, o seletor de ano)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Enter" || e.isComposing || e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('button, a, input, textarea, select, [role="option"], [role="listbox"], [role="combobox"]')) return;
      window.clearTimeout(timer.current);
      // espera o cartão focado registrar a seleção antes de avançar
      timer.current = window.setTimeout(() => nextRef.current(false), 0);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.clearTimeout(timer.current);
    };
  }, []);

  // a cada etapa nova: foco no título (leitores de tela anunciam a pergunta) e rolagem de volta ao topo do fluxo
  const shown = useRef(current);
  useEffect(() => {
    if (shown.current === current) return;
    shown.current = current;
    document.getElementById(`etapa-${current}`)?.focus({ preventScroll: true });
    const root = rootRef.current;
    if (!root) return;
    const top = root.getBoundingClientRect().top + window.scrollY - 88;
    if (window.scrollY > top + 1) window.scrollTo({ top, behavior: reduced ? "auto" : "smooth" });
  }, [current, reduced]);

  function selectChoice(key: string) {
    const c = CHOICES.find((x) => x.key === key)!;
    setChoiceKey(c.key);
    if (count !== null && !countsFor(c.preset).includes(count)) setCount(null);
  }

  function start() {
    if (!config) return;
    setError(null);
    startTransition(async () => {
      try {
        const attempt = await createAttempt(config);
        router.push(`/prova?id=${attempt.id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Não foi possível montar o simulado.");
      }
    });
  }

  function body() {
    switch (current) {
      case "treino":
        return (
          <RadioCards
            aria-labelledby="etapa-treino"
            minColumnWidth={250}
            value={choiceKey}
            onValueChange={selectChoice}
            options={CHOICES.map((c) => ({
              value: c.key,
              label: c.title,
              description: c.detail,
              icon:
                c.preset === "area" ? (
                  <AreaGlyph area={c.areas[0]} play={c.key === choiceKey} />
                ) : (
                  <span className="inline-flex text-ink-2">
                    <AnimIcon icon={CalendarDaysIcon} size={18} play={c.key === choiceKey} />
                  </span>
                ),
            }))}
          />
        );
      case "edicao":
        return (
          <div className="space-y-4">
            <RadioCards
              aria-labelledby="etapa-edicao"
              minColumnWidth={250}
              value={edition}
              onValueChange={(v) => setEdition(v as Edition)}
              options={[
                {
                  value: "mix",
                  label: "Misturar edições",
                  description: `De ${YEARS[YEARS.length - 1]} a ${YEARS[0]}, recomendado`,
                  icon: <Shuffle className="size-[18px]" />,
                },
                {
                  value: "single",
                  label: "Uma edição só",
                  description: "Como se fosse a prova de um ano",
                  icon: <AnimIcon icon={CalendarDaysIcon} size={18} play={edition === "single"} />,
                },
              ]}
            />
            <AnimatePresence initial={false}>
              {edition === "single" ? (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={motionTokens.spring.smooth}
                >
                  <MorphSelect
                    label="Ano da prova"
                    hideLabel
                    placeholder="Escolha o ano"
                    searchable={false}
                    value={year ? String(year) : null}
                    onValueChange={(v) => setYear(Number(v))}
                    maxListHeight={320}
                    items={YEARS.map((y) => ({
                      value: String(y),
                      label: `ENEM ${y}`,
                      meta: y === YEARS[0] ? "mais recente" : undefined,
                    }))}
                  />
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      case "quantidade":
        return (
          <RadioCards
            aria-labelledby="etapa-quantidade"
            layout="list"
            value={count && counts.includes(count) ? String(count) : null}
            onValueChange={(v) => setCount(Number(v))}
            options={counts.map((n) => ({
              value: String(n),
              label: `${n} questões`,
              description:
                n === fullCount
                  ? choice?.preset === "area"
                    ? "Área completa, como no ENEM"
                    : "Dia completo, como no ENEM"
                  : undefined,
              meta: fmtDuration(suggestedMinutes(n) * 60, { short: true }),
            }))}
          />
        );
      case "tempo":
        return (
          <RadioCards
            aria-labelledby="etapa-tempo"
            // grade de 3 do sm para cima; no celular vira lista (a grade ficava 2 + 1 e cortava "Sem cronômetro")
            layout="auto"
            minColumnWidth={190}
            value={timeMode}
            onValueChange={(v) => setTimeMode(v as TimeMode)}
            options={[
              {
                value: "enem",
                label: TIME_LABEL.enem,
                description: "3 min por questão",
                meta: fmtDuration(enemMin * 60, { short: true }),
                icon: <AnimIcon icon={TimerIcon} size={18} play={timeMode === "enem"} />,
              },
              {
                value: "folga",
                label: TIME_LABEL.folga,
                description: "Para aprender com calma",
                meta: fmtDuration(folgaMin * 60, { short: true }),
                icon: <AnimIcon icon={HourglassIcon} size={18} play={timeMode === "folga"} />,
              },
              {
                value: "livre",
                label: TIME_LABEL.livre,
                description: "O tempo só é medido",
                meta: "Livre",
                icon: <AnimIcon icon={EyeOffIcon} size={18} play={timeMode === "livre"} />,
              },
            ]}
          />
        );
      case "lingua":
        return (
          <RadioCards
            aria-labelledby="etapa-lingua"
            minColumnWidth={220}
            value={language}
            onValueChange={(v) => setLanguage(v as Language)}
            options={[
              { value: "ingles", label: LANGUAGE_LABEL.ingles, description: "Questões 1 a 5 em inglês" },
              { value: "espanhol", label: LANGUAGE_LABEL.espanhol, description: "Questões 1 a 5 em espanhol" },
            ]}
          />
        );
      case "revisao":
        if (!config || !choice) return null;
        return (
          <>
            <div className="overflow-hidden rounded-3xl border border-line bg-elev shadow-md">
              <div className="flex items-center gap-3 border-b border-line px-5 py-5 sm:px-6">
                <AreaIcons areas={presetAreas(config)} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold text-ink">{describeConfig(config).what}</p>
                  <p className="truncate text-[13px] text-ink-3">{choice.detail}</p>
                </div>
                <EditButton label="o que treinar" onClick={() => edit("treino")} />
              </div>
              <dl className="divide-y divide-line px-5 text-[13.5px] sm:px-6">
                <Row label="Prova" value={summary.edicao} onEdit={() => edit("edicao")} />
                <Row label="Questões" value={`${config.count}`} onEdit={() => edit("quantidade")} />
                <Row
                  label="Tempo"
                  value={minutes ? fmtDuration(minutes * 60) : "Livre"}
                  onEdit={() => edit("tempo")}
                />
                {hasLC ? <Row label="Língua estrangeira" value={summary.lingua} onEdit={() => edit("lingua")} /> : null}
                <BrowserOnly fallback={<AvailabilityFallback config={config} />}>
                  <Availability config={config} />
                </BrowserOnly>
              </dl>
            </div>
            <p className="mt-4 hidden items-center gap-1.5 text-xs text-ink-3 sm:flex">
              Na prova, <Kbd>A</Kbd>–<Kbd>E</Kbd> respondem e <Kbd>→</Kbd> avança
            </p>
            <GuessTip className="mt-5 sm:hidden" />
          </>
        );
    }
  }

  const copy = STEP_COPY[current];
  const isReview = current === "revisao";

  return (
    <>
      <ProgressLine value={(index + 1) / steps.length} text={isReview ? "Revisão" : `Etapa ${index + 1} de ${questions.length}`} />

      {/* no celular o fluxo ocupa a altura da tela, então a navegação fica no pé dela mesmo nas etapas curtas */}
      <div
        ref={rootRef}
        className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-2xl flex-col px-4 pt-10 sm:block sm:min-h-0 sm:px-6 sm:pb-16 lg:pt-14 lg:pb-20"
      >
        <div className="flex items-baseline justify-between gap-4 text-[13px]">
          <h1 className="font-medium text-ink-3">Monte o seu treino</h1>
          <p className="text-ink-3 tabular" aria-hidden="true">
            {isReview ? "Revisão" : `${index + 1} de ${questions.length}`}
          </p>
        </div>

        {/* respostas dadas até aqui; cada uma volta para a própria etapa */}
        <div className="mt-3 flex min-h-8 flex-wrap items-center gap-1.5">
          {current === "treino" ? (
            <p className="text-[13px] text-ink-3">Leva menos de um minuto.</p>
          ) : !isReview ? (
            steps.slice(0, index).map((s) => (
              <motion.button
                key={s}
                type="button"
                onClick={() => goTo(s)}
                aria-label={`${summary[s]}, alterar`}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={motionTokens.spring.smooth}
                className="inline-flex h-7 items-center gap-1.5 rounded-full border border-line bg-elev px-2.5 text-[12.5px] font-medium text-ink-2 transition-colors hover:border-line-strong hover:text-ink"
              >
                <Check className="size-3 text-brand" strokeWidth={2.5} />
                {summary[s]}
              </motion.button>
            ))
          ) : null}
        </div>

        {/* com o seletor de ano aberto, a etapa sobe acima da navegação para a lista não ficar por baixo dela.
            overflow-x-clip: a etapa que entra desliza da direita e, no celular, alargava a página por um instante;
            o -mx-3/px-3 deixa folga para a sombra dos cartões não ser cortada */}
        <div className="relative -mx-3 mt-6 mb-8 overflow-x-clip px-3 has-[[aria-expanded=true]]:z-[35] sm:mb-0 sm:min-h-[420px]">
          <AnimatePresence mode="popLayout" initial={false} custom={dir}>
            <motion.section
              key={current}
              custom={dir}
              variants={STEP_MOTION}
              initial="enter"
              animate="center"
              exit="exit"
              aria-labelledby={`etapa-${current}`}
              onClick={onCardClick}
            >
              <h2
                id={`etapa-${current}`}
                tabIndex={-1}
                className="text-[28px] leading-[1.1] font-semibold tracking-[-0.035em] text-ink outline-none sm:text-[34px]"
              >
                {copy.title}
              </h2>
              <p className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{copy.hint}</p>
              <div className="mt-7">{body()}</div>
            </motion.section>
          </AnimatePresence>
        </div>

        {error ? (
          <p role="alert" className="mt-6 text-[13px] text-bad">
            {error}
          </p>
        ) : null}

        {/* no celular a navegação gruda no rodapé da tela; do sm para cima fica logo abaixo da etapa */}
        <motion.div
          layout="position"
          transition={motionTokens.spring.smooth}
          className="sticky bottom-0 z-30 -mx-4 mt-auto flex items-center gap-3 border-t border-line bg-elev/95 p-3 backdrop-blur sm:static sm:mx-0 sm:mt-10 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none"
        >
          {index > 0 ? (
            <Button variant="ghost" size="lg" onClick={() => goTo(steps[index - 1])}>
              <AnimIcon icon={ArrowLeftIcon} size={16} />
              Voltar
            </Button>
          ) : null}
          <div className="ml-auto flex items-center gap-4">
            {!isReview ? (
              <span
                aria-hidden="true"
                className={cn(
                  "hidden items-center gap-1.5 text-xs text-ink-3 transition-opacity duration-200 sm:inline-flex",
                  !done[current] && "opacity-0",
                )}
              >
                <Kbd>Enter</Kbd> para continuar
              </span>
            ) : null}
            {isReview ? (
              <Button size="lg" onClick={start} loading={pending} disabled={!config}>
                {pending ? "Preparando a prova" : "Começar agora"}
                {!pending ? <AnimIcon icon={ArrowRightIcon} size={16} /> : null}
              </Button>
            ) : (
              <Button size="lg" onClick={() => next()} disabled={!done[current]}>
                Continuar
                <AnimIcon icon={ArrowRightIcon} size={16} />
              </Button>
            )}
          </div>
        </motion.div>

        {/* no computador a dica fica depois do botão, para o "Começar" aparecer logo abaixo do resumo */}
        {isReview ? <GuessTip className="mt-10 hidden sm:flex" /> : null}
      </div>
    </>
  );
}

function GuessTip({ className }: { className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...motionTokens.spring.smooth, delay: 0.12 }}
      className={cn("flex gap-3 rounded-3xl border border-dashed border-line-strong p-5", className)}
    >
      <Lightbulb className="mt-0.5 size-4 shrink-0 text-warn" />
      <p className="text-[13px] leading-relaxed text-ink-2">
        <span className="font-medium text-ink">No ENEM, chutar é melhor que deixar em branco.</span> Não há desconto
        por erro, mas a TRI percebe chutes incoerentes. Comece pelas questões mais fáceis.
      </p>
    </motion.div>
  );
}

/** Linha fina colada na borda de baixo do header: a borda vai se enchendo de azul a cada etapa. */
function ProgressLine({ value, text }: { value: number; text: string }) {
  return (
    <div
      role="progressbar"
      aria-label="Progresso da montagem do simulado"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      aria-valuetext={text}
      className="pointer-events-none sticky top-16 z-[41] -mt-px h-0.5"
    >
      <motion.div
        className="h-full origin-left rounded-r-full bg-brand"
        initial={false}
        animate={{ scaleX: value }}
        transition={motionTokens.spring.smooth}
      />
    </div>
  );
}

function Availability({ config }: { config: SimConfig }) {
  const catalog = use(loadCatalog());
  const total = availableCount(catalog, config);
  const tri = presetAreas(config).reduce(
    (s, a) => s + poolFor(catalog, a, config).filter((i) => !i.noTri).length,
    0,
  );
  const short = total < config.count;
  return (
    <>
      <Row
        label="Banco disponível"
        aligned
        value={
          <span className={short ? "text-warn" : undefined}>
            {fmtInt(total)} questões{short ? " (menos que o pedido)" : ""}
          </span>
        }
      />
      <TriNote count={fmtInt(tri)} />
    </>
  );
}

/** Mesma altura da versão carregada (a frase quebra igual), para o botão "Começar" não descer quando o banco chega. */
function AvailabilityFallback({ config }: { config: SimConfig }) {
  return (
    <>
      <Row label="Banco disponível" value="…" aligned />
      {/* uma área tem centenas de questões com TRI; um dia inteiro passa de mil */}
      <TriNote count={config.preset === "area" ? "000" : "0.000"} skeleton />
    </>
  );
}

function TriNote({ count, skeleton }: { count: string; skeleton?: boolean }) {
  return (
    <div className="flex gap-2 py-3 text-[12.5px] leading-relaxed text-ink-3" aria-hidden={skeleton || undefined}>
      <Info className={cn("mt-0.5 size-3.5 shrink-0", skeleton && "opacity-40")} />
      <span className={cn(skeleton && "box-decoration-clone rounded bg-sunken text-transparent")}>
        {count} delas têm parâmetros TRI publicados pelo INEP e entram na sua nota estimada.
      </span>
    </div>
  );
}

/** `aligned` reserva o espaço do "Alterar" para o valor alinhar com as linhas editáveis. */
function Row({
  label,
  value,
  onEdit,
  aligned,
}: {
  label: string;
  value: React.ReactNode;
  onEdit?: () => void;
  aligned?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <dt className="text-ink-3">{label}</dt>
      <dd className="flex items-center gap-3 text-right font-medium text-ink tabular">
        {value}
        {onEdit ? <EditButton label={label} onClick={onEdit} /> : aligned ? <span className="w-12" /> : null}
      </dd>
    </div>
  );
}

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Alterar ${label.toLowerCase()}`}
      className="w-12 shrink-0 rounded-md text-right text-[12.5px] font-medium text-brand-ink underline-offset-2 hover:underline"
    >
      Alterar
    </button>
  );
}
