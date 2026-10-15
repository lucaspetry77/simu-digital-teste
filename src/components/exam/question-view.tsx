"use client";

import { AnimatePresence, motion } from "motion/react";
import { CircleCheck, CircleHelp, Dices, Eraser, Strikethrough } from "lucide-react";
import { BookmarkIcon } from "@/components/icons/bookmark";
import { AnimIcon } from "@/components/ui/anim-icon";
import { useEffect, useLayoutEffect, useRef } from "react";
import { AreaDot } from "@/components/ui/area-icon";
import { Kbd } from "@/components/ui/kbd";
import { isMathOnly, Markdown, OptionText } from "@/components/ui/markdown";
import { AREA_META, type Letter } from "@/lib/areas";
import { cn } from "@/lib/cn";
import { assetUrl, type Question } from "@/lib/data";
import type { AnswerState, Confidence } from "@/lib/store";
import { type Mark, mergeMarks, paintMarks, selectionToMark } from "./marker";

export const CONFIDENCE: { value: Confidence; label: string; short: string; key: string; icon: typeof CircleCheck; tone: string }[] = [
  { value: "sure", label: "Tenho certeza", short: "Certeza", key: "1", icon: CircleCheck, tone: "text-ok" },
  { value: "unsure", label: "Fiquei em dúvida", short: "Dúvida", key: "2", icon: CircleHelp, tone: "text-warn" },
  { value: "guess", label: "Chutei", short: "Chute", key: "3", icon: Dices, tone: "text-bad" },
];

export function QuestionView({
  question,
  index,
  total,
  state,
  direction,
  markerOn,
  askConfidence,
  onChoose,
  onEliminate,
  onConfidence,
  onFlag,
  onMarks,
}: {
  question: Question;
  index: number;
  total: number;
  state: AnswerState | undefined;
  direction: number;
  markerOn: boolean;
  askConfidence: boolean;
  onChoose: (l: Letter) => void;
  onEliminate: (l: Letter) => void;
  onConfidence: (c: Confidence) => void;
  onFlag: () => void;
  onMarks: (marks: Mark[]) => void;
}) {
  const textRef = useRef<HTMLDivElement>(null);
  const marks = state?.marks;

  // redesenha as marcações quando a questão (ou as marcações) mudam
  useLayoutEffect(() => {
    paintMarks(textRef.current, marks);
  }, [question.id, marks]);
  useEffect(() => () => paintMarks(null, undefined), []);

  function handleMouseUp() {
    if (!markerOn || !textRef.current) return;
    const mark = selectionToMark(textRef.current);
    if (!mark) return;
    onMarks(mergeMarks(marks ?? [], mark));
    window.getSelection()?.removeAllRanges();
  }

  const meta = AREA_META[question.area];
  const flagged = !!state?.flagged;

  return (
    <motion.article
      key={question.id}
      initial={{ opacity: 0, x: direction * 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto w-full max-w-[44rem]"
      aria-labelledby={`q-${question.id}-title`}
    >
      <header className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-2.5 text-[12.5px] text-ink-3">
          <span
            id={`q-${question.id}-title`}
            className="text-[13px] font-medium text-ink tabular"
          >
            {String(index + 1).padStart(2, "0")}
            <span className="font-normal text-ink-3">/{String(total).padStart(2, "0")}</span>
          </span>
          <span className="h-3.5 w-px bg-line-strong" />
          <span className="flex items-center gap-1.5 truncate">
            <AreaDot area={question.area} />
            {meta.short} · ENEM {question.year} · questão {question.number}
          </span>
        </div>
        <button
          type="button"
          onClick={onFlag}
          aria-pressed={flagged}
          title="Revisar depois (R)"
          className={cn(
            "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-2.5 text-[12.5px] font-medium transition-colors",
            flagged ? "bg-warn-soft text-warn" : "text-ink-3 hover:bg-hover hover:text-ink",
          )}
        >
          <AnimIcon icon={BookmarkIcon} size={15} play={flagged} className={flagged ? "[&_path]:fill-current" : ""} />
          {/* no celular só o ícone aparece, mas o texto continua sendo o nome do botão para leitores de tela */}
          <span className="sr-only sm:not-sr-only">{flagged ? "Marcada para revisar" : "Revisar depois"}</span>
        </button>
      </header>

      <div
        ref={textRef}
        onMouseUp={handleMouseUp}
        onTouchEnd={handleMouseUp}
        className={cn("reading mt-6", markerOn && "cursor-text selection:bg-hl/70")}
      >
        {question.context ? <Markdown>{question.context}</Markdown> : null}
        <div className={cn("font-medium", question.context && "mt-5")}>
          <Markdown>{question.stem}</Markdown>
        </div>
      </div>

      {marks?.length ? (
        <button
          type="button"
          onClick={() => onMarks([])}
          className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] text-ink-3 hover:text-ink"
        >
          <Eraser className="size-3.5" /> Limpar marcações
        </button>
      ) : null}

      <div role="radiogroup" aria-label="Alternativas" className="mt-7 space-y-2.5">
        {question.options.map((o) => (
          <OptionCard
            key={o.letter}
            letter={o.letter}
            text={o.text}
            image={o.image}
            selected={state?.choice === o.letter}
            eliminated={!!state?.eliminated?.includes(o.letter)}
            onChoose={() => onChoose(o.letter)}
            onEliminate={() => onEliminate(o.letter)}
          />
        ))}
      </div>

      <AnimatePresence initial={false}>
        {askConfidence && state?.choice ? (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.2 }}
            className="mt-5 flex flex-col gap-2.5 rounded-2xl border border-line bg-sunken/60 p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <p className="px-1 text-[13px] whitespace-nowrap text-ink-2">Quão confiante você está?</p>
            {/* no celular as três opções dividem a largura (rótulo curto); do sm para cima cada uma tem a
                largura do próprio texto, sem cortar "Fiquei em dúvida" */}
            <div className="grid grid-cols-3 gap-1.5 sm:flex" role="radiogroup" aria-label="Confiança na resposta">
              {CONFIDENCE.map((c) => {
                const active = state.confidence === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => onConfidence(c.value)}
                    className={cn(
                      "inline-flex h-9 items-center justify-center gap-1.5 rounded-full border px-2.5 text-[12.5px] font-medium transition-colors sm:px-3",
                      active
                        ? "border-line-strong bg-elev text-ink shadow-sm"
                        : "border-transparent text-ink-3 hover:bg-elev/70 hover:text-ink",
                    )}
                  >
                    <motion.span
                      animate={active ? { scale: [1, 1.25, 1], rotate: c.value === "guess" ? [0, -25, 20, 0] : 0 } : { scale: 1, rotate: 0 }}
                      transition={{ duration: 0.45 }}
                      className="inline-flex"
                    >
                      <c.icon className={cn("size-4", active ? c.tone : "")} />
                    </motion.span>
                    <span className="truncate sm:hidden">{c.short}</span>
                    <span className="hidden whitespace-nowrap sm:inline">{c.label}</span>
                    <Kbd className="hidden lg:inline-flex">{c.key}</Kbd>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.article>
  );
}

function OptionCard({
  letter,
  text,
  image,
  selected,
  eliminated,
  onChoose,
  onEliminate,
}: {
  letter: Letter;
  text: string;
  image: string | null;
  selected: boolean;
  eliminated: boolean;
  onChoose: () => void;
  onEliminate: () => void;
}) {
  const mathOnly = !image && isMathOnly(text);
  return (
    <div className="group relative">
      <button
        type="button"
        role="radio"
        aria-checked={selected}
        aria-label={`Alternativa ${letter}${eliminated ? " (riscada)" : ""}`}
        onClick={onChoose}
        onContextMenu={(e) => {
          e.preventDefault();
          onEliminate();
        }}
        className={cn(
          // fórmula sozinha (fração em destaque) é mais alta que uma linha: centraliza com a letra
          "flex w-full gap-3.5 rounded-2xl border bg-elev py-3.5 pr-12 pl-3.5 text-left transition-[border-color,background-color,box-shadow] duration-150",
          mathOnly ? "items-center" : "items-start",
          selected
            ? "border-brand bg-brand-softer shadow-[0_0_0_3px_color-mix(in_oklab,var(--brand)_14%,transparent)]"
            : "border-line hover:border-line-strong hover:bg-sunken/60",
        )}
      >
        <motion.span
          animate={selected ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          transition={{ duration: 0.25 }}
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-full border-[1.5px] text-[13px] font-medium transition-colors",
            selected
              ? "border-brand bg-brand text-white"
              : eliminated
                ? "border-line text-ink-3/60"
                : "border-line-strong text-ink-2 group-hover:border-ink-3",
          )}
        >
          {letter}
        </motion.span>
        <span
          className={cn(
            "reading min-w-0 flex-1 leading-relaxed transition-opacity [&_p]:m-0",
            !mathOnly && "pt-[3px]",
            eliminated && !selected && "line-through decoration-ink-3/70 decoration-[1.5px] opacity-45",
          )}
        >
          {text ? <OptionText text={text} struck={eliminated && !selected} /> : null}
          {image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={assetUrl(image)} alt={`Imagem da alternativa ${letter}`} className="!my-1 max-h-56" loading="lazy" />
          ) : null}
        </span>
      </button>
      <button
        type="button"
        onClick={onEliminate}
        aria-label={eliminated ? `Desfazer risco da alternativa ${letter}` : `Riscar alternativa ${letter}`}
        title={eliminated ? "Desfazer risco" : "Riscar alternativa (Shift + letra)"}
        className={cn(
          // after:-inset-1.5 aumenta a área de toque para 44px sem mudar o desenho do botão
          "absolute right-2.5 grid size-8 place-items-center rounded-full transition after:absolute after:-inset-1.5",
          mathOnly ? "top-1/2 -translate-y-1/2" : "top-3",
          eliminated
            ? "bg-sunken text-ink-2"
            : "text-ink-3 opacity-100 hover:bg-hover hover:text-ink sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100",
        )}
      >
        <Strikethrough className="size-4" />
      </button>
    </div>
  );
}
