"use client";

import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { AreaIcon } from "@/components/ui/area-icon";
import { AREA_META, type Area } from "@/lib/areas";
import { cn } from "@/lib/cn";
import type { Percentiles } from "@/lib/data";
import { fmtInt, fmtPct, fmtScore } from "@/lib/format";
import type { AreaResult } from "@/lib/store";

export function CountUp({ value, decimals = 1, className }: { value: number; decimals?: number; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const [shown, setShown] = useState(reduce ? value : 0);
  useMotionValueEvent(mv, "change", setShown);
  useEffect(() => {
    const controls = animate(mv, value, { duration: reduce ? 0 : 1.1, ease: [0.16, 1, 0.3, 1] });
    return () => controls.stop();
  }, [mv, value, reduce]);
  const text = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(shown);
  const [int, dec] = text.split(",");
  return (
    <span className={cn("tabular", className)}>
      {int}
      {dec ? <span className="text-ink-3">,{dec}</span> : null}
    </span>
  );
}

/** Distribuição nacional (INEP) com a posição do estudante — inspirado no relatório da Uxcel. */
export function Distribution({ area, score, pct }: { area: Area; score: number; pct: Percentiles }) {
  const data = pct.areas[area];
  const bins = data.bins.filter((b) => b.max != null && b.max <= 1000);
  const max = Math.max(...bins.map((b) => b.count));
  const pos = Math.min(100, Math.max(0, (score / 1000) * 100));
  const meanPos = (data.mean / 1000) * 100;
  // Rótulos sem sobreposição: "média" fica do lado oposto ao seu; perto da média, o "você" se ancora
  // na própria linha, para longe dela; nas pontas, ele não vaza para fora do gráfico.
  const above = score >= data.mean;
  const youShift =
    Math.abs(pos - meanPos) < 12
      ? above
        ? "translate-x-0"
        : "-translate-x-full"
      : pos < 7
        ? "translate-x-0"
        : pos > 93
          ? "-translate-x-full"
          : "-translate-x-1/2";
  return (
    <div>
      <div className="relative h-36">
        <div className="absolute inset-0 flex items-end gap-1.5">
          {bins.map((b) => {
            const contains = score >= b.min && score < (b.max ?? Infinity);
            const below = (b.max ?? 0) <= score;
            return (
              <div key={b.min} className="flex h-full flex-1 flex-col justify-end">
                <div
                  className={cn(
                    "w-full origin-bottom animate-[grow_0.9s_cubic-bezier(0.16,1,0.3,1)_both] rounded-t-md",
                    // no escuro o "sunken" é quase a cor do cartão e a curva acima da sua nota sumia
                    contains ? "bg-brand" : below ? "bg-brand/25" : "bg-sunken dark:bg-line-strong",
                  )}
                  style={{ height: `${Math.max(2, (b.count / max) * 100)}%` }}
                  title={`${b.min}–${b.max}: ${fmtInt(b.count)} participantes`}
                />
              </div>
            );
          })}
        </div>
        {/* média nacional */}
        <div className="absolute top-0 bottom-0 border-l border-dashed border-ink-3/50" style={{ left: `${meanPos}%` }}>
          <span className={cn("absolute -top-1 text-[10.5px] whitespace-nowrap text-ink-3", above ? "right-1.5" : "left-1.5")}>
            média {fmtInt(data.mean)}
          </span>
        </div>
        {/* você */}
        <div className="absolute -top-3 bottom-0 w-0" style={{ left: `${pos}%` }}>
          <div className="absolute top-5 bottom-0 left-0 w-0.5 -translate-x-1/2 bg-ink" />
          <span
            className={cn(
              "absolute top-0 left-0 rounded-md bg-ink px-1.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap text-inverse",
              youShift,
            )}
          >
            você · {fmtInt(score)}
          </span>
        </div>
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10.5px] text-ink-3">
        {[0, 200, 400, 600, 800, 1000].map((v) => (
          <span key={v}>{v}</span>
        ))}
      </div>
    </div>
  );
}

export function AreaScoreRow({ area, r, active, onClick }: { area: Area; r: AreaResult; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex flex-1 items-center gap-3 rounded-2xl border p-3 text-left transition",
        active ? "border-ink bg-elev shadow-sm" : "border-line hover:border-line-strong",
      )}
    >
      <AreaIcon area={area} />
      <span className="min-w-0">
        <span className="block text-[12px] text-ink-3">{AREA_META[area].short}</span>
        <span className="block font-mono text-[18px] font-semibold text-ink tabular">
          {r.score != null ? fmtScore(r.score) : "–"}
        </span>
      </span>
      <span className="ml-auto text-right text-[12px] text-ink-3 tabular">
        {r.correct}/{r.total}
        <span className="block">{r.percentile != null ? `P${fmtInt(r.percentile)}` : ""}</span>
      </span>
    </button>
  );
}

export function Ring({ value, size = 56, stroke = 6, color = "var(--brand)" }: { value: number; size?: number; stroke?: number; color?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-sunken)" strokeWidth={stroke} />
      {/* com 0% não desenha o arco: a ponta arredondada viraria um pontinho de "progresso" */}
      {value > 0 ? (
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - Math.min(1, value))}
          style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)" }}
        />
      ) : null}
    </svg>
  );
}

export function percentileSentence(p: number | null, area: Area, year: number) {
  if (p == null) return null;
  return (
    <>
      Melhor que <strong className="font-medium text-ink">≈ {fmtPct(p)}</strong> dos participantes do ENEM {year} em{" "}
      {AREA_META[area].short}.
    </>
  );
}
