"use client";

import { EyeOff, Timer } from "lucide-react";
import { useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { fmtClock, fmtDuration } from "@/lib/format";
import type { Clock } from "./clock";

export function usePace(clock: Clock, limitSec: number | null, total: number, answered: number) {
  const elapsed = useSyncExternalStore(clock.subscribe, clock.get, clock.get);
  const remaining = limitSec != null ? Math.max(0, limitSec - elapsed) : null;
  const left = Math.max(1, total - answered);
  const perQuestion = remaining != null ? remaining / left : null;
  const pace: "ok" | "tight" | "late" | null =
    perQuestion == null || answered >= total ? null : perQuestion >= 170 ? "ok" : perQuestion >= 110 ? "tight" : "late";
  return { elapsed, remaining, perQuestion, pace };
}

const PACE = {
  ok: { label: "No ritmo", dot: "bg-ok", text: "text-ok" },
  tight: { label: "Ritmo apertado", dot: "bg-warn", text: "text-warn" },
  late: { label: "Acelere um pouco", dot: "bg-bad", text: "text-bad" },
};

export function ExamTimer({
  clock,
  limitSec,
  total,
  answered,
  hidden,
  onToggleHidden,
}: {
  clock: Clock;
  limitSec: number | null;
  total: number;
  answered: number;
  hidden: boolean;
  onToggleHidden: () => void;
}) {
  const { elapsed, remaining, perQuestion, pace } = usePace(clock, limitSec, total, answered);
  const shown = remaining ?? elapsed;
  const ending = remaining != null && remaining <= 300;

  return (
    <div className="flex items-center gap-2">
      {pace && !hidden ? (
        <span
          className={cn("hidden items-center gap-1.5 text-[12.5px] font-medium xl:inline-flex", PACE[pace].text)}
          title={perQuestion ? `≈ ${fmtDuration(perQuestion)} por questão restante` : undefined}
        >
          <span className={cn("size-1.5 rounded-full", PACE[pace].dot)} />
          {PACE[pace].label}
          {perQuestion ? (
            // minutos e segundos (de 5 em 5s): só minutos arredondados contradiziam o aviso ("Ritmo apertado ·
            // 3min" com 2min37s; "No ritmo · 2min" com 2min59s)
            <span className="font-normal text-ink-3 tabular">· {fmtDuration(Math.round(perQuestion / 5) * 5)}/questão</span>
          ) : null}
        </span>
      ) : null}
      <button
        type="button"
        onClick={onToggleHidden}
        title={hidden ? "Mostrar cronômetro" : "Esconder cronômetro (reduz a ansiedade)"}
        aria-label={hidden ? "Mostrar cronômetro" : `Tempo ${remaining != null ? "restante" : "decorrido"}: ${fmtClock(shown)}. Clique para esconder`}
        className={cn(
          "group inline-flex h-9 items-center gap-2 rounded-full border px-3 text-[14px] font-semibold tabular transition-colors",
          ending && !hidden ? "border-bad/30 bg-bad-soft text-bad" : "border-line bg-elev text-ink hover:border-line-strong",
        )}
      >
        {hidden ? (
          <EyeOff className="size-4 text-ink-3" />
        ) : (
          // no hover o relógio dá lugar ao "esconder" no mesmo espaço, sem alargar o botão
          <span className="relative grid size-4 place-items-center">
            <Timer className={cn("size-4 transition-opacity group-hover:opacity-0", ending ? "" : "text-ink-3")} />
            <EyeOff className="absolute size-4 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </span>
        )}
        {hidden ? <span className="font-sans text-[12.5px] text-ink-3">Tempo oculto</span> : fmtClock(shown)}
      </button>
    </div>
  );
}
