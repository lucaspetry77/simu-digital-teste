"use client";

import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronRight,
  CircleCheck,
  CircleHelp,
  Dices,
  ExternalLink,
  Info,
  Minus,
  TriangleAlert,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AreaDot } from "@/components/ui/area-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Markdown, OptionText } from "@/components/ui/markdown";
import { Segmented } from "@/components/ui/segmented";
import { AREA_META } from "@/lib/areas";
import { cn } from "@/lib/cn";
import { assetUrl } from "@/lib/data";
import { fmtDuration } from "@/lib/format";
import { DIFFICULTY_LABEL } from "@/lib/tri";
import type { ReviewRow } from "./types";

type Filter = "all" | "wrong" | "unsure" | "flagged";

const CONF_ICON = { sure: CircleCheck, unsure: CircleHelp, guess: Dices } as const;
const CONF_LABEL = { sure: "Certeza", unsure: "Dúvida", guess: "Chute" } as const;
const CONF_COLOR = { sure: "text-ok", unsure: "text-warn", guess: "text-bad" } as const;

function StatusDot({ status, n }: { status: ReviewRow["status"]; n: number }) {
  return (
    <span
      className={cn(
        "grid size-8 shrink-0 place-items-center rounded-full font-mono text-[12px] font-medium tabular",
        status === "ok" && "bg-ok-soft text-ok",
        status === "bad" && "bg-bad-soft text-bad",
        status === "blank" && "border border-dashed border-line-strong text-ink-3",
        status === "void" && "bg-sunken text-ink-3",
      )}
    >
      {n}
    </span>
  );
}

export function ReviewList({ rows, onOpen }: { rows: ReviewRow[]; onOpen: (i: number) => void }) {
  const [filter, setFilter] = useState<Filter>("all");
  const counts = {
    all: rows.length,
    wrong: rows.filter((r) => r.status === "bad" || r.status === "blank").length,
    unsure: rows.filter((r) => r.ans?.confidence === "guess" || r.ans?.confidence === "unsure").length,
    flagged: rows.filter((r) => r.ans?.flagged).length,
  };
  const list = rows.filter((r) =>
    filter === "all"
      ? true
      : filter === "wrong"
        ? r.status === "bad" || r.status === "blank"
        : filter === "unsure"
          ? r.ans?.confidence === "guess" || r.ans?.confidence === "unsure"
          : r.ans?.flagged,
  );

  return (
    <div>
      <div className="no-scrollbar -mx-1 overflow-x-auto px-1">
        <Segmented
          label="Filtrar questões"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "all", label: `Todas · ${counts.all}` },
            { value: "wrong", label: `Erros e brancos · ${counts.wrong}` },
            { value: "unsure", label: `Dúvidas e chutes · ${counts.unsure}` },
            { value: "flagged", label: `Marcadas · ${counts.flagged}` },
          ]}
        />
      </div>
      <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-elev">
        {list.length === 0 ? (
          <li className="px-5 py-10 text-center text-[13.5px] text-ink-3">Nada por aqui. 🎉</li>
        ) : null}
        {list.map((r) => {
          const ConfIcon = r.ans?.confidence ? CONF_ICON[r.ans.confidence] : null;
          return (
            <li key={r.id}>
              <button
                type="button"
                onClick={() => onOpen(r.i)}
                className="flex w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-hover/70 sm:px-5"
              >
                <StatusDot status={r.status} n={r.i + 1} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
                    <AreaDot area={r.area} />
                    <span className="truncate">{r.comp?.label ?? AREA_META[r.area].short}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-[12px] text-ink-3">
                    ENEM {r.q.year} · questão {r.q.number}
                    {r.difficulty ? ` · ${DIFFICULTY_LABEL[r.difficulty]}` : ""}
                    {r.time ? ` · ${fmtDuration(r.time, { short: true })}` : ""}
                  </span>
                </span>
                {/* colunas de largura fixa: confiança, marcador e resposta ficam alinhados de uma linha para a outra */}
                <span className="hidden w-4 sm:block">
                  {ConfIcon ? (
                    <ConfIcon className={cn("size-4", CONF_COLOR[r.ans!.confidence!])} aria-label={CONF_LABEL[r.ans!.confidence!]} />
                  ) : null}
                </span>
                <span className="hidden w-4 sm:block">
                  {r.ans?.flagged ? <Bookmark className="size-4 fill-current text-warn" aria-label="Marcada para revisar" /> : null}
                </span>
                <span className="flex min-w-14 items-center justify-end gap-1.5 font-mono text-[13px] tabular">
                  {r.status === "void" ? (
                    <span className="text-[12px] text-ink-3">anulada</span>
                  ) : r.status === "ok" ? (
                    <span className="text-ok">{r.key}</span>
                  ) : (
                    <>
                      <span className={r.status === "blank" ? "text-ink-3" : "text-bad line-through"}>
                        {r.ans?.choice ?? "–"}
                      </span>
                      <ChevronRight className="size-3 text-ink-3" />
                      <span className="text-ok">{r.key}</span>
                    </>
                  )}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function ReviewModal({
  rows,
  index,
  onIndex,
  onClose,
}: {
  rows: ReviewRow[];
  index: number | null;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const open = index != null;
  const row = open ? rows[index] : null;
  const currentDot = useRef<HTMLButtonElement>(null);

  // em provas longas as bolinhas rolam: a da questão aberta sempre fica à vista
  useEffect(() => {
    currentDot.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [index]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" && index! < rows.length - 1) onIndex(index! + 1);
      if (e.key === "ArrowLeft" && index! > 0) onIndex(index! - 1);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, index, rows.length, onClose, onIndex]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && row ? (
        <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
          <motion.div
            className="absolute inset-0 bg-[rgb(10_10_14/0.45)] backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`Revisão da questão ${row.i + 1}`}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
            className="relative flex h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl border border-line bg-elev shadow-lg sm:h-[88dvh] sm:rounded-3xl"
          >
            {/* navegação por bolinhas */}
            <div className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-6">
              <p className="shrink-0 text-[13.5px] font-medium text-ink">
                Questão {row.i + 1}
                <span className="font-normal text-ink-3"> de {rows.length}</span>
              </p>
              {/* px-1.5/py-1.5: espaço para o anel da bolinha atual não ser cortado pela rolagem */}
              <div className="no-scrollbar flex min-w-0 flex-1 items-center gap-1 overflow-x-auto px-1.5 py-1.5">
                {rows.map((r) => (
                  <button
                    key={r.id}
                    ref={r.i === row.i ? currentDot : undefined}
                    type="button"
                    onClick={() => onIndex(r.i)}
                    aria-label={`Ir para questão ${r.i + 1}`}
                    className={cn(
                      "size-3 shrink-0 rounded-full transition",
                      r.status === "ok" && "bg-ok",
                      r.status === "bad" && "bg-bad",
                      r.status === "blank" && "border-[1.5px] border-ink-3",
                      r.status === "void" && "bg-line-strong",
                      r.i === row.i && "ring-2 ring-ink ring-offset-2 ring-offset-elev",
                    )}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar revisão"
                className="grid size-9 shrink-0 place-items-center rounded-full text-ink-3 hover:bg-hover hover:text-ink"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* a key recria as colunas a cada questão, então a leitura sempre começa do topo */}
            <div
              key={row.id}
              className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-[minmax(0,1fr)_320px] lg:overflow-hidden"
            >
              {/* min-h-0 só no lg: no celular a coluna precisa da própria altura, senão a lateral é desenhada por cima */}
              <div className="px-5 py-6 sm:px-8 lg:min-h-0 lg:overflow-y-auto">
                <QuestionReview row={row} />
              </div>
              <aside className="border-t border-line bg-sunken/40 px-5 py-6 sm:px-6 lg:overflow-y-auto lg:border-t-0 lg:border-l">
                <ReviewSidebar row={row} />
              </aside>
            </div>

            <div className="flex items-center justify-between border-t border-line px-4 py-3 sm:px-6">
              <Button variant="secondary" onClick={() => onIndex(row.i - 1)} disabled={row.i === 0}>
                <ArrowLeft /> Anterior
              </Button>
              <Button variant="secondary" onClick={() => onIndex(row.i + 1)} disabled={row.i === rows.length - 1}>
                Próxima <ArrowRight />
              </Button>
            </div>
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}

function QuestionReview({ row }: { row: ReviewRow }) {
  const { q, ans, key } = row;
  return (
    <article key={row.id}>
      <p className="flex items-center gap-2 text-[12.5px] text-ink-3">
        <AreaDot area={row.area} /> {AREA_META[row.area].short} · ENEM {q.year} · questão {q.number}
      </p>
      <div className="reading mt-4">
        {q.context ? <Markdown>{q.context}</Markdown> : null}
        <div className={cn("font-medium", q.context && "mt-5")}>
          <Markdown>{q.stem}</Markdown>
        </div>
      </div>
      <div className="mt-6 space-y-2.5">
        {q.options.map((o) => {
          const isKey = o.letter === key;
          const isChoice = o.letter === ans?.choice;
          const eliminated = ans?.eliminated?.includes(o.letter);
          const why = q.solution?.options?.[o.letter];
          return (
            <div
              key={o.letter}
              className={cn(
                "rounded-2xl border p-3.5",
                isKey ? "border-ok/40 bg-ok-soft/60" : isChoice ? "border-bad/40 bg-bad-soft/60" : "border-line",
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    "grid size-7 shrink-0 place-items-center rounded-full border-[1.5px] font-mono text-[12px] font-medium",
                    isKey ? "border-ok bg-ok text-white" : isChoice ? "border-bad bg-bad text-white" : "border-line-strong text-ink-3",
                  )}
                >
                  {isKey ? <Check className="size-3.5" strokeWidth={3} /> : isChoice ? <X className="size-3.5" strokeWidth={3} /> : o.letter}
                </span>
                <div className="min-w-0 flex-1">
                  <div className={cn("reading [&_p]:m-0", eliminated && !isKey && "text-ink-3 line-through")}>
                    {o.text ? <OptionText text={o.text} struck={eliminated && !isKey} /> : null}
                    {o.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={assetUrl(o.image)} alt={`Imagem da alternativa ${o.letter}`} className="!my-1 max-h-48" loading="lazy" />
                    ) : null}
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    {isKey ? <Badge tone="ok">Gabarito</Badge> : null}
                    {isChoice && !isKey ? <Badge tone="bad">Sua resposta</Badge> : null}
                    {isChoice && isKey ? <Badge tone="ok">Sua resposta</Badge> : null}
                    {eliminated ? <Badge tone="outline">Você riscou</Badge> : null}
                  </div>
                  {why ? <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{why}</p> : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </article>
  );
}

function ReviewSidebar({ row }: { row: ReviewRow }) {
  const { q, ans } = row;
  const ConfIcon = ans?.confidence ? CONF_ICON[ans.confidence] : null;
  return (
    <div className="space-y-6">
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl px-4 py-3.5 text-[14px] font-medium",
          row.status === "ok" && "bg-ok-soft text-ok",
          row.status === "bad" && "bg-bad-soft text-bad",
          row.status === "blank" && "bg-warn-soft text-warn",
          row.status === "void" && "bg-sunken text-ink-2",
        )}
      >
        {row.status === "ok" ? <CircleCheck className="size-5" /> : row.status === "void" ? <Minus className="size-5" /> : <TriangleAlert className="size-5" />}
        {row.status === "ok"
          ? "Você acertou"
          : row.status === "bad"
            ? `Você marcou ${ans?.choice}, a resposta é ${row.key}`
            : row.status === "blank"
              ? `Em branco. A resposta é ${row.key}`
              : "Questão anulada pelo INEP"}
      </div>

      <dl className="space-y-2.5 text-[13px]">
        <Meta label="Dificuldade (TRI)" value={row.difficulty ? DIFFICULTY_LABEL[row.difficulty] : "Sem parâmetro"} />
        <Meta label="Competência" value={row.comp ? `${row.comp.label}` : "–"} />
        <Meta label="Habilidade" value={row.comp ? row.comp.skill : "–"} />
        <Meta label="Seu tempo" value={row.time ? fmtDuration(row.time) : "–"} />
        <Meta
          label="Sua confiança"
          value={
            ConfIcon ? (
              <span className={cn("inline-flex items-center gap-1", CONF_COLOR[ans!.confidence!])}>
                <ConfIcon className="size-3.5" /> {CONF_LABEL[ans!.confidence!]}
              </span>
            ) : (
              "Não marcada"
            )
          }
        />
      </dl>

      {q.note ? (
        <div className="rounded-2xl border border-warn/30 bg-warn-soft/60 p-4">
          <p className="flex items-center gap-1.5 text-[12.5px] font-medium text-warn">
            <Info className="size-3.5" /> {q.note.label}
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-2">{q.note.text}</p>
        </div>
      ) : null}

      {q.solution ? (
        <div>
          <p className="text-[13px] font-medium text-ink">Resolução</p>
          <div className="reading mt-2 text-[14px] leading-relaxed text-ink-2">
            <Markdown>{q.solution.text}</Markdown>
          </div>
          {q.solution.sources.length ? (
            <ul className="mt-3 space-y-1.5">
              {q.solution.sources.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[12px] text-ink-3 hover:text-ink"
                  >
                    <ExternalLink className="size-3" /> {s.title}
                  </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : (
        <p className="text-[13px] text-ink-3">Esta questão ainda não tem resolução comentada.</p>
      )}

      {q.source.url ? (
        <a
          href={q.source.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[12px] text-ink-3 hover:text-ink"
        >
          <ExternalLink className="size-3" /> Prova e gabarito oficiais (INEP)
        </a>
      ) : null}
    </div>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-ink-3">{label}</dt>
      <dd className="text-right font-medium text-ink">{value}</dd>
    </div>
  );
}
