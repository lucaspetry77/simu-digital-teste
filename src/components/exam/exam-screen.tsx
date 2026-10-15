"use client";

import { useRouter } from "next/navigation";
import { Highlighter } from "lucide-react";
import { Tooltip } from "@/components/arc/tooltip/tooltip";
import { ArrowLeftIcon } from "@/components/icons/arrow-left";
import { ArrowRightIcon } from "@/components/icons/arrow-right";
import { LayoutGridIcon } from "@/components/icons/layout-grid";
import { SettingsIcon } from "@/components/icons/settings";
import { WindIcon } from "@/components/icons/wind";
import { XIcon } from "@/components/icons/x";
import { AnimIcon, HoverScope, useHover } from "@/components/ui/anim-icon";
import { useCallback, useEffect, useRef, useState } from "react";
import { AreaIcons } from "@/components/ui/area-icon";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Modal } from "@/components/ui/modal";
import { Progress } from "@/components/ui/progress";
import { AREAS, type Letter, LETTERS } from "@/lib/areas";
import { cn } from "@/lib/cn";
import { assetUrl, type Catalog, type Percentiles, type Question, type TriModel } from "@/lib/data";
import { fmtInt } from "@/lib/format";
import { scoreAttempt } from "@/lib/simulado";
import {
  type AnswerState,
  type Attempt,
  type Confidence,
  resolveNotebookItems,
  saveAttempt,
  setPrefs,
  usePrefs,
} from "@/lib/store";
import { AnswerSheet, AnswerSheetLegend } from "./answer-sheet";
import { Breathe } from "./breathe";
import { createClock } from "./clock";
import { ExamSettings } from "./exam-settings";
import { ExamTimer } from "./exam-timer";
import { type Mark, markerSupported } from "./marker";
import { CONFIDENCE, QuestionView } from "./question-view";

type Dialog = null | "finish" | "exit" | "settings" | "sheet" | "timeup";

export function ExamScreen({
  attempt: initial,
  questions,
  catalog,
  tri,
  pct,
}: {
  attempt: Attempt;
  questions: Question[];
  catalog: Catalog;
  tri: TriModel;
  pct: Percentiles;
}) {
  const router = useRouter();
  const prefs = usePrefs();
  const total = initial.items.length;

  const [answers, setAnswers] = useState<Record<string, AnswerState>>(initial.answers);
  const [current, setCurrent] = useState(Math.min(initial.current, total - 1));
  const [direction, setDirection] = useState(1);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [breathing, setBreathing] = useState(false);
  const [markerOn, setMarkerOn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [limitMin, setLimitMin] = useState(initial.config.timeLimitMin);
  const [clock] = useState(() => createClock(initial.elapsedSec));
  const [canMark] = useState(markerSupported);

  // tempo gasto em cada questão — muda a cada segundo, então fica fora do estado
  const questionTime = useRef<Record<string, number>>(
    Object.fromEntries(Object.entries(initial.answers).map(([id, a]) => [id, a.timeSec ?? 0])),
  );
  const live = useRef({ answers, current, limitMin, dialog, breathing });
  useEffect(() => {
    live.current = { answers, current, limitMin, dialog, breathing };
  });

  const question = questions[current];
  const state = answers[question.id];
  const answered = Object.values(answers).filter((a) => a.choice).length;
  const limitSec = limitMin ? limitMin * 60 : null;

  /* ── Persistência ──────────────────────────────────────────────────── */
  const snapshot = useCallback((): Attempt => {
    const { answers: ans, current: cur, limitMin: lim } = live.current;
    const merged: Record<string, AnswerState> = {};
    for (const { id } of initial.items) {
      const a = ans[id];
      const t = questionTime.current[id];
      if (a || t) merged[id] = { ...(a ?? { choice: null }), timeSec: t ?? 0 };
    }
    return {
      ...initial,
      config: { ...initial.config, timeLimitMin: lim },
      answers: merged,
      current: cur,
      elapsedSec: clock.get(),
      updatedAt: Date.now(),
    };
  }, [initial, clock]);

  const submittingRef = useRef(false);
  const persist = useCallback(() => {
    if (!submittingRef.current) saveAttempt(snapshot());
  }, [snapshot]);

  useEffect(() => {
    const t = setTimeout(persist, 250);
    return () => clearTimeout(t);
  }, [answers, current, persist]);

  useEffect(() => {
    const save = () => persist();
    const onVisibility = () => document.visibilityState === "hidden" && persist();
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onVisibility);
    const autosave = setInterval(persist, 10_000);
    return () => {
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(autosave);
    };
  }, [persist]);

  /* ── Relógio (pausa quando a aba não está visível) ─────────────────── */
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState !== "visible" || submittingRef.current) return;
      const { current: cur, limitMin: lim, dialog: dlg } = live.current;
      clock.tick();
      const qid = initial.items[cur]?.id;
      if (qid) questionTime.current[qid] = (questionTime.current[qid] ?? 0) + 1;
      if (lim && clock.get() >= lim * 60 && dlg !== "timeup") setDialog("timeup");
    }, 1000);
    return () => clearInterval(id);
  }, [clock, initial.items]);

  /* ── Ações ─────────────────────────────────────────────────────────── */
  const update = useCallback((id: string, fn: (a: AnswerState) => AnswerState) => {
    setAnswers((prev) => ({ ...prev, [id]: fn(prev[id] ?? { choice: null }) }));
  }, []);

  const choose = useCallback(
    (l: Letter) =>
      update(question.id, (a) => ({
        ...a,
        choice: l,
        eliminated: a.eliminated?.filter((x) => x !== l),
        confidence: a.choice === l ? a.confidence : undefined,
      })),
    [question.id, update],
  );
  const eliminate = useCallback(
    (l: Letter) =>
      update(question.id, (a) => {
        const has = a.eliminated?.includes(l);
        return {
          ...a,
          choice: !has && a.choice === l ? null : a.choice,
          eliminated: has ? a.eliminated!.filter((x) => x !== l) : [...(a.eliminated ?? []), l],
        };
      }),
    [question.id, update],
  );
  const setConfidence = useCallback(
    (c: Confidence) => update(question.id, (a) => ({ ...a, confidence: a.confidence === c ? undefined : c })),
    [question.id, update],
  );
  const toggleFlag = useCallback(() => update(question.id, (a) => ({ ...a, flagged: !a.flagged })), [question.id, update]);
  const setMarks = useCallback((marks: Mark[]) => update(question.id, (a) => ({ ...a, marks })), [question.id, update]);
  const clearAnswer = () => update(question.id, (a) => ({ ...a, choice: null, confidence: undefined }));

  const go = useCallback(
    (i: number) => {
      if (i < 0 || i >= total) return;
      setDirection(i > live.current.current ? 1 : -1);
      setCurrent(i);
      window.scrollTo({ top: 0 });
    },
    [total],
  );
  const next = useCallback(() => {
    if (live.current.current >= total - 1) setDialog("finish");
    else go(live.current.current + 1);
  }, [go, total]);
  const prev = useCallback(() => go(live.current.current - 1), [go]);

  async function finish() {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    const attempt = snapshot();
    const keys = Object.fromEntries(questions.map((q) => [q.id, q.answer]));
    const result = scoreAttempt(attempt, keys, catalog, tri, pct);
    const now = Date.now();
    saveAttempt({ ...attempt, status: "done", finishedAt: now, updatedAt: now, result, keys });
    if (attempt.config.preset === "caderno") {
      resolveNotebookItems(attempt.items.filter(({ id }) => keys[id] && attempt.answers[id]?.choice === keys[id]).map((i) => i.id));
    }
    router.replace(`/resultado?id=${attempt.id}`);
  }

  function pauseAndExit() {
    persist();
    router.push("/painel");
  }

  // Baixa antes as figuras da próxima questão: sem isso o texto "pula" quando a imagem chega.
  useEffect(() => {
    const q = questions[current + 1];
    if (!q) return;
    const markdown = [q.context, q.stem, ...q.options.map((o) => o.text)].join("\n");
    const srcs = [...markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)].map((m) => m[1]);
    for (const o of q.options) if (o.image) srcs.push(o.image);
    for (const src of srcs) new Image().src = assetUrl(src);
  }, [questions, current]);

  /* ── Teclado ───────────────────────────────────────────────────────── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (live.current.dialog || live.current.breathing || e.metaKey || e.ctrlKey || e.altKey) return;
      if (t.closest("input, textarea, select, [contenteditable]")) return;
      const key = e.key.toUpperCase();
      if ((LETTERS as string[]).includes(key)) {
        e.preventDefault();
        if (e.shiftKey) eliminate(key as Letter);
        else choose(key as Letter);
      } else if (["1", "2", "3"].includes(e.key) && prefs.askConfidence && live.current.answers[question.id]?.choice) {
        setConfidence(CONFIDENCE[Number(e.key) - 1].value);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        next();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (key === "R") {
        toggleFlag();
      } else if (key === "M" && canMark) {
        setMarkerOn((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [choose, eliminate, setConfidence, toggleFlag, next, prev, question.id, canMark, prefs.askConfidence]);

  const closeDialog = useCallback(() => setDialog(null), []);
  const closeBreathing = useCallback(() => setBreathing(false), []);

  const areas = AREAS.filter((a) => initial.items.some((i) => i.area === a));
  const blanks = initial.items.map((it, i) => ({ ...it, i })).filter((it) => !answers[it.id]?.choice);
  const flagged = initial.items.map((it, i) => ({ ...it, i })).filter((it) => answers[it.id]?.flagged);
  const isLast = current === total - 1;

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      {/* Barra superior */}
      <header className="sticky top-0 z-30 border-b border-line bg-bg/85 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center gap-3 px-3 sm:px-6">
          <Tooltip content="Pausar e sair" side="bottom">
            <ToolButton onClick={() => setDialog("exit")} label="Pausar e sair da prova" icon={XIcon} />
          </Tooltip>
          <div className="hidden min-w-0 items-center gap-2.5 sm:flex">
            <AreaIcons areas={areas} size="sm" />
            <p className="truncate text-[13.5px] font-medium text-ink">{initial.title}</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            {canMark ? (
              <Tooltip content={markerOn ? "Desligar marca-texto (M)" : "Destaque trechos do texto (M)"} side="bottom">
                <ToolButton
                  active={markerOn}
                  onClick={() => setMarkerOn((v) => !v)}
                  label="Marca-texto"
                  staticIcon={<Highlighter className="size-[17px]" />}
                  text="Marca-texto"
                />
              </Tooltip>
            ) : null}
            <Tooltip content="Pausa guiada de 30 segundos" side="bottom">
              <ToolButton onClick={() => setBreathing(true)} label="Pausa para respirar" icon={WindIcon} text="Respirar" />
            </Tooltip>
            <Tooltip content="Texto, tema e atalhos" side="bottom">
              <ToolButton onClick={() => setDialog("settings")} label="Ajustes da prova" icon={SettingsIcon} />
            </Tooltip>
            <div className="ml-1.5">
              <ExamTimer
                clock={clock}
                limitSec={limitSec}
                total={total}
                answered={answered}
                hidden={prefs.hideTimer}
                onToggleHidden={() => setPrefs({ hideTimer: !prefs.hideTimer })}
              />
            </div>
          </div>
        </div>
        <Progress
          value={(answered / total) * 100}
          className="h-[3px] rounded-none bg-transparent"
          label={`${answered} de ${total} respondidas`}
        />
      </header>

      {markerOn ? (
        <div className="sticky top-[59px] z-20 mx-auto mt-3 flex w-fit items-center gap-2 rounded-full border border-line bg-elev px-3.5 py-1.5 text-[12.5px] text-ink-2 shadow-md">
          <span className="size-2.5 rounded-full bg-hl" />
          Marca-texto ligado: selecione um trecho do texto para destacar
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[1240px] flex-1 gap-12 px-4 sm:px-6">
        <main className="min-w-0 flex-1 pt-8 pb-36 sm:pt-10">
          <QuestionView
            question={question}
            index={current}
            total={total}
            state={state}
            direction={direction}
            markerOn={markerOn}
            askConfidence={prefs.askConfidence}
            onChoose={choose}
            onEliminate={eliminate}
            onConfidence={setConfidence}
            onFlag={toggleFlag}
            onMarks={setMarks}
          />
          {state?.choice ? (
            <div className="mx-auto mt-3 max-w-[44rem]">
              <button type="button" onClick={clearAnswer} className="text-[12.5px] text-ink-3 underline-offset-2 hover:text-ink hover:underline">
                Limpar resposta
              </button>
            </div>
          ) : null}
        </main>

        <aside className="hidden w-[264px] shrink-0 pt-10 lg:block">
          <div className="sticky top-24 space-y-3">
            <div className="rounded-2xl border border-line bg-elev p-4 shadow-sm">
              <div className="flex items-baseline justify-between">
                <p className="text-[13px] font-medium text-ink">Cartão-resposta</p>
                <p className="text-[12px] text-ink-3 tabular">
                  {answered}/{total}
                </p>
              </div>
              {/* o respiro interno (p-1.5) evita que o anel da questão atual e a bolinha de revisar sejam cortados */}
              <div className="-mx-1.5 mt-1.5 max-h-[52vh] overflow-y-auto p-1.5">
                <AnswerSheet items={initial.items} answers={answers} current={current} onJump={go} />
              </div>
              <AnswerSheetLegend className="mt-3" />
              <Button className="mt-4 w-full" onClick={() => setDialog("finish")}>
                Entregar prova
              </Button>
            </div>
            <p className="px-1 text-[11.5px] leading-relaxed text-ink-3">
              Salvo automaticamente neste navegador. Se fechar a aba, o tempo pausa.
            </p>
          </div>
        </aside>
      </div>

      {/* Barra inferior */}
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-elev/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[68px] max-w-[1240px] items-center justify-between gap-3 px-3 sm:px-6">
          <Button variant="secondary" onClick={prev} disabled={current === 0} aria-label="Questão anterior">
            <AnimIcon icon={ArrowLeftIcon} size={16} />
            <span className="hidden sm:inline">Anterior</span>
          </Button>
          <span className="lg:hidden">
            <Button variant="ghost" onClick={() => setDialog("sheet")}>
              <AnimIcon icon={LayoutGridIcon} size={16} />
              Cartão · {answered}/{total}
            </Button>
          </span>
          <p className="hidden items-center gap-1.5 text-[12px] text-ink-3 lg:flex">
            <Kbd>A</Kbd>–<Kbd>E</Kbd> responder
            <span className="mx-1.5 text-line-strong">·</span>
            <Kbd>⇧</Kbd>+letra riscar
            <span className="mx-1.5 text-line-strong">·</span>
            <Kbd>←</Kbd>
            <Kbd>→</Kbd> navegar
          </p>
          <Button onClick={next}>
            {isLast ? "Revisar e entregar" : "Próxima"}
            <AnimIcon icon={ArrowRightIcon} size={16} />
          </Button>
        </div>
      </footer>

      {/* Diálogos */}
      <Modal open={dialog === "sheet"} onClose={closeDialog} title="Cartão-resposta" description={`${answered} de ${total} respondidas`} size="sm">
        <AnswerSheet
          items={initial.items}
          answers={answers}
          current={current}
          onJump={(i) => {
            go(i);
            setDialog(null);
          }}
        />
        <AnswerSheetLegend className="mt-4" />
        <Button className="mt-5 w-full" onClick={() => setDialog("finish")}>
          Entregar prova
        </Button>
      </Modal>

      <Modal
        open={dialog === "finish"}
        onClose={closeDialog}
        title="Entregar a prova?"
        description="Depois de entregar você vê a nota, o gabarito comentado e o tempo por questão."
        footer={
          <>
            <Button variant="secondary" onClick={closeDialog}>
              Voltar para a prova
            </Button>
            <Button onClick={finish} disabled={submitting} data-autofocus>
              {submitting ? "Calculando sua nota" : "Entregar e ver resultado"}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          <Stat label="Respondidas" value={`${answered}/${total}`} />
          <Stat label="Em branco" value={fmtInt(blanks.length)} tone={blanks.length ? "warn" : undefined} />
          <Stat label="Para revisar" value={fmtInt(flagged.length)} />
        </div>
        {blanks.length ? (
          <div className="mt-5">
            <p className="text-[13px] text-ink-2">
              <strong className="font-medium text-ink">Em branco conta como erro.</strong> Risque o que você tem certeza
              que está errado e arrisque entre o que sobrar.
            </p>
            <JumpList list={blanks} onJump={(i) => (go(i), setDialog(null))} />
          </div>
        ) : null}
        {flagged.length ? (
          <div className="mt-5">
            <p className="text-[13px] text-ink-2">Você marcou estas para revisar:</p>
            <JumpList list={flagged} onJump={(i) => (go(i), setDialog(null))} />
          </div>
        ) : null}
      </Modal>

      <Modal
        open={dialog === "exit"}
        onClose={closeDialog}
        title="Pausar a prova?"
        description="Tudo fica salvo neste navegador, com o cronômetro pausado. Você continua de onde parou pelo painel."
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={pauseAndExit}>
              Pausar e sair
            </Button>
            <Button onClick={closeDialog} data-autofocus>
              Continuar a prova
            </Button>
          </>
        }
      />

      <Modal
        open={dialog === "timeup"}
        onClose={() => {}}
        hideClose
        title="Tempo esgotado"
        description="No ENEM, a prova seria recolhida agora. Você pode entregar como está ou continuar sem limite. O resultado registra o tempo extra."
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setLimitMin(null);
                setDialog(null);
              }}
            >
              Continuar sem limite
            </Button>
            <Button onClick={finish} disabled={submitting} data-autofocus>
              Entregar e ver resultado
            </Button>
          </>
        }
      />

      <ExamSettings open={dialog === "settings"} onClose={closeDialog} />
      <Breathe open={breathing} onClose={closeBreathing} />
    </div>
  );
}

function ToolButton({
  active,
  onClick,
  label,
  icon,
  staticIcon,
  text,
  ...rest
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  icon?: Parameters<typeof AnimIcon>[0]["icon"];
  staticIcon?: React.ReactNode;
  text?: string;
} & Omit<React.ComponentProps<"button">, "onClick">) {
  const [hovered, bind] = useHover();
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      {...rest}
      onMouseEnter={(e) => {
        bind.onMouseEnter();
        rest.onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        bind.onMouseLeave();
        rest.onMouseLeave?.(e);
      }}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[13px] font-medium transition-colors",
        active ? "bg-hl/60 text-ink" : "text-ink-3 hover:bg-hover hover:text-ink",
      )}
    >
      <HoverScope hovered={hovered}>
        {icon ? <AnimIcon icon={icon} size={17} /> : staticIcon}
        {text ? <span className="hidden md:inline">{text}</span> : null}
      </HoverScope>
    </button>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "warn" }) {
  return (
    <div className="rounded-2xl border border-line bg-sunken/50 px-3 py-3">
      <p className={cn("text-xl font-medium tabular", tone === "warn" ? "text-warn" : "text-ink")}>{value}</p>
      <p className="mt-0.5 text-[12px] text-ink-3">{label}</p>
    </div>
  );
}

function JumpList({ list, onJump }: { list: { i: number; id: string }[]; onJump: (i: number) => void }) {
  return (
    <div className="mt-2.5 flex flex-wrap gap-1.5">
      {list.map(({ i, id }) => (
        <button
          key={id}
          type="button"
          onClick={() => onJump(i)}
          className="h-8 min-w-9 rounded-full border border-line bg-elev px-2 text-[12.5px] font-medium text-ink-2 tabular transition-colors hover:border-line-strong hover:text-ink"
        >
          {i + 1}
        </button>
      ))}
    </div>
  );
}
