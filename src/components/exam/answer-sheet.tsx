"use client";

import { useEffect, useRef } from "react";
import { AREA_META, AREAS } from "@/lib/areas";
import { cn } from "@/lib/cn";
import type { Attempt } from "@/lib/store";

export function AnswerSheet({
  items,
  answers,
  current,
  onJump,
}: {
  items: Attempt["items"];
  answers: Attempt["answers"];
  current: number;
  onJump: (i: number) => void;
}) {
  const currentRef = useRef<HTMLButtonElement>(null);
  const groups = AREAS.map((area) => ({
    area,
    rows: items.map((it, i) => ({ ...it, i })).filter((it) => it.area === area),
  })).filter((g) => g.rows.length);

  // em provas longas o cartão rola: a questão atual sempre fica à vista
  useEffect(() => {
    currentRef.current?.scrollIntoView({ block: "nearest" });
  }, [current]);

  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.area}>
          {groups.length > 1 ? (
            <p className="mb-2 flex items-center gap-1.5 text-[11.5px] font-medium text-ink-3">
              <span className="size-1.5 rounded-full" style={{ background: AREA_META[g.area].color }} />
              {AREA_META[g.area].short}
            </p>
          ) : null}
          <div className="grid grid-cols-5 gap-1.5">
            {g.rows.map(({ id, i }) => {
              const a = answers[id];
              const answered = !!a?.choice;
              const isCurrent = i === current;
              return (
                <button
                  key={id}
                  ref={isCurrent ? currentRef : undefined}
                  type="button"
                  onClick={() => onJump(i)}
                  aria-label={`Questão ${i + 1}${answered ? `, respondida ${a.choice}` : ", em branco"}${a?.flagged ? ", marcada para revisar" : ""}`}
                  aria-current={isCurrent ? "step" : undefined}
                  className={cn(
                    // scroll-m*: ao rolar até a atual, deixa à vista o anel, a bolinha e o nome da área acima
                    "relative flex h-10 scroll-mt-8 scroll-mb-2 flex-col items-center justify-center rounded-full border text-center transition-colors",
                    answered ? "border-transparent bg-ink text-inverse" : "border-line bg-elev text-ink-3 hover:border-line-strong",
                    isCurrent && "ring-2 ring-brand ring-offset-2 ring-offset-elev",
                  )}
                >
                  <span className={cn("leading-none tabular", answered ? "text-[9.5px] opacity-60" : "text-[12px]")}>
                    {i + 1}
                  </span>
                  {answered ? <span className="mt-0.5 text-[13px] leading-none font-medium">{a.choice}</span> : null}
                  {a?.flagged ? (
                    <span className="absolute -top-1 -right-1 size-2.5 rounded-full border-2 border-elev bg-warn" />
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Legenda do cartão. Fica fora da área que rola, para não sumir em provas longas. */
export function AnswerSheetLegend({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-wrap gap-x-2.5 gap-y-1.5 text-[11.5px] whitespace-nowrap text-ink-3", className)}>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-ink" /> Respondida
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full border border-line-strong" /> Em branco
      </span>
      <span className="flex items-center gap-1.5">
        <span className="size-2.5 rounded-full bg-warn" /> Revisar
      </span>
    </div>
  );
}
